import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import emailService from '@/services/email/email.service';
import { isExpired, getRemainingTimeString } from '@/lib/date';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'u***@example.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || '').trim();
    const password = body.password || '';

    if (!identifier || !password) {
      return NextResponse.json(
        { message: 'Email/Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Email/Username atau password salah.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Email/Username atau password salah.' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'PENDING_VERIFICATION' },
        { status: 403 }
      );
    }

    // Check soft block status
    if (user.otpSoftBlockUntil && !isExpired(user.otpSoftBlockUntil)) {
      const remaining = getRemainingTimeString(user.otpSoftBlockUntil);
      return NextResponse.json(
        {
          message: `Akun Anda sedang diblokir sementara karena terlalu banyak percobaan. Sisa waktu: ${remaining}`,
        },
        { status: 429 }
      );
    }

    // Credentials valid! Invalidate previous unused 2FA tokens for this user
    await prisma.twoFactorToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate random 6-digit numeric OTP (cryptographically secure)
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const preAuthToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    // Save TwoFactorToken to DB
    await prisma.twoFactorToken.create({
      data: {
        userId: user.id,
        otpHash,
        preAuthToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Send 2FA Email OTP
    await emailService.sendTwoFactorOtpEmail(user.email, user.name, rawOtp);

    return NextResponse.json({
      success: true,
      requires2FA: true,
      preAuthToken,
      maskedEmail: maskEmail(user.email),
    });
  } catch (error: any) {
    console.error('[Login Step 1 API Error]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
