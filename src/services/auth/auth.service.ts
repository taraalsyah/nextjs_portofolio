import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/password';
import { generateOTP } from '@/utils/otp';
import { emailService } from '../email/email.service';

export class AuthService {
  async registerUser(name: string, email: string, passwordText: string) {
    // 1. Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('Email sudah terdaftar.');
      (error as any).status = 409;
      throw error;
    }

    // 2. Hash password
    const hashedPassword = await hashPassword(passwordText);

    // 3. Generate OTP & Expired time (10 menit)
    const otpCode = generateOTP();
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Prisma Transaction untuk membuat User dan EmailVerification secara atomik
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          status: 'PENDING',
        },
      });

      const verification = await tx.emailVerification.create({
        data: {
          userId: user.id,
          code: otpCode,
          expiredAt,
        },
      });

      return { user, verification };
    });

    // 5. Kirim email OTP
    try {
      await emailService.sendOTPEmail(result.user.email, result.user.name, otpCode);
    } catch (err) {
      console.error('Failed to send verification email during registration:', err);
    }

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      status: result.user.status,
    };
  }

  async verifyOTP(email: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('User tidak ditemukan.');
      (error as any).status = 404;
      throw error;
    }

    // Cari kode verifikasi terbaru yang cocok untuk user tersebut
    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        code,
        verifiedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      const error = new Error('Kode verifikasi tidak valid.');
      (error as any).status = 400;
      throw error;
    }

    // Cek apakah expired
    if (verification.expiredAt < new Date()) {
      const error = new Error('Kode verifikasi telah kedaluwarsa.');
      (error as any).status = 400;
      throw error;
    }

    // Update secara atomik status user dan status verifikasi
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });

      await tx.emailVerification.update({
        where: { id: verification.id },
        data: {
          verifiedAt: new Date(),
        },
      });
    });

    return { success: true };
  }

  async resendOTP(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('User tidak ditemukan.');
      (error as any).status = 404;
      throw error;
    }

    if (user.status !== 'PENDING') {
      const error = new Error('Email Anda sudah terverifikasi.');
      (error as any).status = 400;
      throw error;
    }

    // Rate Limiting & Cooldown Checks
    const latestVerification = await prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestVerification) {
      const secondsSinceLastRequest = Math.floor((Date.now() - latestVerification.createdAt.getTime()) / 1000);
      if (secondsSinceLastRequest < 60) {
        const error = new Error('Kirim ulang kode hanya bisa dilakukan setelah 60 detik.');
        (error as any).status = 429;
        throw error;
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.emailVerification.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentCount >= 5) {
      const error = new Error('Maksimal pengiriman OTP adalah 5 kali dalam 1 jam.');
      (error as any).status = 429;
      throw error;
    }

    // Nonaktifkan OTP lama
    await prisma.emailVerification.updateMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
      data: {
        expiredAt: new Date(),
      },
    });

    // Generate OTP baru
    const otpCode = generateOTP();
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiredAt,
      },
    });

    // Kirim email OTP baru
    try {
      await emailService.sendOTPEmail(user.email, user.name, otpCode);
    } catch (err) {
      console.error('Failed to send resent verification email:', err);
    }

    return { success: true };
  }
}

export const authService = new AuthService();
export default authService;
