import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import emailService from '@/services/email/email.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const preAuthToken = (body.preAuthToken || '').trim();

    if (!preAuthToken) {
      return NextResponse.json(
        { error: 'Sesi verifikasi tidak valid. Silakan login kembali.' },
        { status: 400 }
      );
    }

    const previousToken = await prisma.twoFactorToken.findUnique({
      where: { preAuthToken },
      include: { user: true },
    });

    if (!previousToken) {
      return NextResponse.json(
        { error: 'Sesi verifikasi tidak ditemukan. Silakan login kembali.' },
        { status: 400 }
      );
    }

    // Enforce 60s cooldown limit
    const now = Date.now();
    const createdAtMs = new Date(previousToken.createdAt).getTime();
    const secondsPassed = Math.floor((now - createdAtMs) / 1000);

    if (secondsPassed < 60) {
      const waitSeconds = 60 - secondsPassed;
      return NextResponse.json(
        { error: `Harap tunggu ${waitSeconds} detik sebelum meminta OTP baru.` },
        { status: 429 }
      );
    }

    // Invalidate previous token
    await prisma.twoFactorToken.update({
      where: { id: previousToken.id },
      data: { usedAt: new Date() },
    });

    // Generate fresh OTP & preAuthToken
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const newPreAuthToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    await prisma.twoFactorToken.create({
      data: {
        userId: previousToken.userId,
        otpHash,
        preAuthToken: newPreAuthToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Dispatch email
    await emailService.sendTwoFactorOtpEmail(
      previousToken.user.email,
      previousToken.user.name,
      rawOtp
    );

    return NextResponse.json({
      success: true,
      preAuthToken: newPreAuthToken,
      message: 'Kode OTP baru telah dikirim ke email Anda.',
    });
  } catch (error: any) {
    console.error('[Resend 2FA OTP API Error]:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim ulang OTP.' },
      { status: 500 }
    );
  }
}
