import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { BLOG_POSTS } from '@/data/blogPosts';
import { safeRedisGet, safeRedisSet } from '@/lib/redis';
import { sendNewCommentNotification } from '@/services/email/comment-notification.service';

export const runtime = 'nodejs';

// In-memory fallback rate limiter if Redis is offline
const inMemoryRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5;

  const current = inMemoryRateMap.get(ipHash);
  if (!current || now > current.resetAt) {
    inMemoryRateMap.set(ipHash, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count += 1;
  return true;
}

// In-memory fallback duplicate check (ipHash + slug + contentHash -> timestamp)
const recentSubmissions = new Map<string, number>();

function isDuplicateSubmission(ipHash: string, slug: string, content: string): boolean {
  const now = Date.now();
  const hashKey = `${ipHash}:${slug}:${crypto.createHash('md5').update(content).digest('hex')}`;
  const lastTime = recentSubmissions.get(hashKey);

  if (lastTime && now - lastTime < 60 * 1000) {
    // Submitted within last 60 seconds
    return true;
  }

  recentSubmissions.set(hashKey, now);

  // Clean old entries (older than 5 minutes)
  if (recentSubmissions.size > 500) {
    for (const [k, time] of recentSubmissions.entries()) {
      if (now - time > 5 * 60 * 1000) {
        recentSubmissions.delete(k);
      }
    }
  }

  return false;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { ok: false, message: 'Parameter slug wajib diisi.' },
        { status: 400 }
      );
    }

    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || '10', 10)),
      50
    );
    const cursor = searchParams.get('cursor');

    const whereClause = {
      postSlug: slug,
      status: 'approved',
    };

    // Query comments excluding sensitive fields like email and ipHash
    const comments = await prisma.comment.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: parseInt(cursor, 10) },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        postSlug: true,
        name: true,
        content: true,
        createdAt: true,
      },
    });

    let nextCursor: number | null = null;
    if (comments.length > limit) {
      const nextItem = comments.pop();
      nextCursor = comments[comments.length - 1]?.id ?? null;
    }

    const totalCount = await prisma.comment.count({
      where: whereClause,
    });

    return NextResponse.json({
      ok: true,
      comments,
      nextCursor,
      totalCount,
    });
  } catch (error: any) {
    console.error('[GET /api/blog/comments error]:', error?.message || error);
    return NextResponse.json(
      { ok: false, message: 'Gagal memuat daftar komentar.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { slug, name, email, content, website } = body;

    // 1. Honeypot check (anti-bot)
    // If website is filled, return fake success so bots assume success
    if (website && typeof website === 'string' && website.trim().length > 0) {
      return NextResponse.json(
        { ok: true, message: 'Komentar berhasil dikirim.' },
        { status: 200 }
      );
    }

    // 2. Validate article slug against active blog posts
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Slug artikel tidak valid.' },
        { status: 400 }
      );
    }

    const post = BLOG_POSTS.find((p) => p.id === slug.trim());
    if (!post) {
      return NextResponse.json(
        { ok: false, message: 'Artikel blog tidak ditemukan.' },
        { status: 400 }
      );
    }

    // 3. Validate & sanitize Name (1 - 80 chars, strip control characters)
    const sanitizedName =
      typeof name === 'string'
        ? name.replace(/[\x00-\x1F\x7F]/g, '').trim()
        : '';

    if (!sanitizedName || sanitizedName.length < 1 || sanitizedName.length > 80) {
      return NextResponse.json(
        { ok: false, message: 'Nama wajib diisi (maksimal 80 karakter).' },
        { status: 400 }
      );
    }

    // 4. Validate Email format
    const sanitizedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !sanitizedEmail ||
      !emailRegex.test(sanitizedEmail) ||
      sanitizedEmail.length > 100
    ) {
      return NextResponse.json(
        { ok: false, message: 'Format alamat email tidak valid.' },
        { status: 400 }
      );
    }

    // 5. Validate Content (3 - 1000 chars, strip control chars except newlines)
    const sanitizedContent =
      typeof content === 'string'
        ? content.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
        : '';

    if (
      !sanitizedContent ||
      sanitizedContent.length < 3 ||
      sanitizedContent.length > 1000
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Komentar harus berisi antara 3 sampai 1000 karakter.',
        },
        { status: 400 }
      );
    }

    // 6. Client IP hash (hash only, never store raw IP)
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const ipHash = crypto
      .createHash('sha256')
      .update(clientIp + (process.env.NEXTAUTH_SECRET || 'comment-salt'))
      .digest('hex');

    // 7. Rate Limiting (max 5 per 10 minutes)
    let isAllowed = true;
    try {
      const redisKey = `ratelimit:comment:${ipHash}`;
      const currentCount = await safeRedisGet(redisKey);
      if (currentCount && parseInt(currentCount, 10) >= 5) {
        isAllowed = false;
      } else {
        const nextVal = currentCount ? parseInt(currentCount, 10) + 1 : 1;
        await safeRedisSet(redisKey, String(nextVal), 600); // 10 minutes TTL
      }
    } catch {
      // Fallback in-memory rate limit
      isAllowed = checkRateLimit(ipHash);
    }

    if (!isAllowed) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Terlalu banyak permintaan komentar. Harap tunggu beberapa menit sebelum mengirim lagi.',
        },
        { status: 429 }
      );
    }

    // 8. Prevent duplicate submission within 60 seconds
    if (isDuplicateSubmission(ipHash, slug, sanitizedContent)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Komentar serupa telah dikirim baru saja. Harap tunggu sebentar.',
        },
        { status: 400 }
      );
    }

    // 9. Moderation Policy
    // Default: "approved" (directly visible). Easily toggled to "pending" via env variable
    const requireApproval = process.env.COMMENTS_REQUIRE_APPROVAL === 'true';
    const status = requireApproval ? 'pending' : 'approved';

    // 10. Save comment to database
    const savedComment = await prisma.comment.create({
      data: {
        postSlug: post.id,
        name: sanitizedName,
        email: sanitizedEmail,
        content: sanitizedContent,
        status,
        ipHash,
      },
      select: {
        id: true,
        postSlug: true,
        name: true,
        content: true,
        createdAt: true,
        status: true,
      },
    });

    // 11. Dispatch email notification asynchronously (non-blocking, never fails the response)
    sendNewCommentNotification({
      postTitle: post.title,
      postSlug: post.id,
      commenterName: sanitizedName,
      commenterEmail: sanitizedEmail,
      content: sanitizedContent,
      status,
      createdAt: savedComment.createdAt,
    }).catch((emailError) => {
      console.error(
        '[POST /api/blog/comments] Background email sending failed:',
        emailError?.message || emailError
      );
    });

    const successMessage = requireApproval
      ? 'Komentar Anda berhasil dikirim dan menunggu persetujuan moderator.'
      : 'Komentar berhasil dikirim.';

    return NextResponse.json(
      {
        ok: true,
        message: successMessage,
        comment: savedComment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/blog/comments error]:', error?.message || error);
    return NextResponse.json(
      {
        ok: false,
        message:
          'Terjadi kesalahan saat menyimpan komentar Anda. Silakan coba lagi nanti.',
      },
      { status: 500 }
    );
  }
}
