import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/utils/password';
import { generateOTP } from '@/utils/otp';
import { emailService } from '../email/email.service';
import { otpService } from '../otp/otp.service';
import { addMinutesUTC } from '@/lib/date';

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

    // 2. Cari role "Operation" dari database (Role Management)
    const operationRole = await prisma.role.findFirst({
      where: {
        name: 'Operation',
      },
    });

    if (!operationRole) {
      const error = new Error('Role "Operation" tidak ditemukan pada Role Management. Registrasi tidak dapat diproses.');
      (error as any).status = 400;
      throw error;
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(passwordText);

    // 4. Generate OTP & Expired time (10 menit)
    const otpCode = generateOTP();
    const expiredAt = addMinutesUTC(10);

    // 5. Prisma Transaction untuk membuat User dan EmailVerification secara atomik
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          status: 'PENDING',
          roleId: operationRole.id,
          role: operationRole.name,
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

  async verifyOTP(email: string, code: string, meta?: { ipAddress?: string | null; userAgent?: string | null }) {
    return await otpService.verifyOTP(email, code, meta);
  }

  async resendOTP(email: string, meta?: { ipAddress?: string | null; userAgent?: string | null }) {
    return await otpService.resendOTP(email, meta);
  }
}

export const authService = new AuthService();
export default authService;
