import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const preAuthToken = (body.preAuthToken || '').trim();
    const otp = (body.otp || '').trim();

    if (!preAuthToken) {
      return NextResponse.json(
        { error: 'Invalid verification session. Please login again.' },
        { status: 400 }
      );
    }

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check your email and try again.' },
        { status: 400 }
      );
    }

    const tokenRecord = await prisma.twoFactorToken.findUnique({
      where: { preAuthToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.usedAt !== null) {
      return NextResponse.json(
        { error: 'Invalid verification session. Please login again.' },
        { status: 400 }
      );
    }

    // Check expiry (5 minutes)
    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check attempts limit (max 5 attempts)
    if (tokenRecord.attempts >= 5) {
      // Invalidate token
      await prisma.twoFactorToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });

      return NextResponse.json(
        { error: 'Too many verification attempts. Please request a new verification code.' },
        { status: 429 }
      );
    }

    // Compare OTP with bcrypt hash
    const isOtpValid = await bcrypt.compare(otp, tokenRecord.otpHash);

    if (!isOtpValid) {
      const newAttempts = tokenRecord.attempts + 1;

      // Update attempt count
      await prisma.twoFactorToken.update({
        where: { id: tokenRecord.id },
        data: {
          attempts: newAttempts,
          ...(newAttempts >= 5 ? { usedAt: new Date() } : {}),
        },
      });

      if (newAttempts >= 5) {
        return NextResponse.json(
          { error: 'Too many verification attempts. Please request a new verification code.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid verification code. Please check your email and try again.' },
        { status: 400 }
      );
    }

    // OTP Verified successfully! Mark as used.
    await prisma.twoFactorToken.update({
      where: { id: tokenRecord.id },
      data: {
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      email: tokenRecord.user.email,
      message: 'Kode OTP berhasil diverifikasi.',
    });
  } catch (error: any) {
    console.error('[Verify 2FA OTP API Error]:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat verifikasi OTP.' },
      { status: 500 }
    );
  }
}
