import { prisma } from './prisma';
import { emailService } from '@/services/email/email.service';
import { generateSecureToken, hashToken } from './token';
import bcrypt from 'bcryptjs';

export class PasswordResetService {
  async createResetToken(email: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Jika email tidak ditemukan, jangan beritahu client (hindari email enumeration)
    if (!user) {
      return { success: true };
    }

    // 1. Cooldown & Rate Limiting Check
    const latestToken = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestToken) {
      const secondsSinceLastRequest = Math.floor((Date.now() - latestToken.createdAt.getTime()) / 1000);
      if (secondsSinceLastRequest < 60) {
        const error = new Error('Kirim ulang link reset password hanya bisa dilakukan setelah 60 detik.');
        (error as any).status = 429;
        throw error;
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentCount >= 5) {
      const error = new Error('Batas maksimal permintaan reset password adalah 5 kali dalam 1 jam.');
      (error as any).status = 429;
      throw error;
    }

    // 2. Nonaktifkan semua token reset password sebelumnya milik user ini
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        expiresAt: new Date(), // Kadaluwarsa saat ini juga
      },
    });

    // 3. Generate token baru (32 bytes = 64 hex characters)
    const token = generateSecureToken();
    const hashed = hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Berlaku 10 menit

    // 4. Simpan ke database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashed,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // 5. Buat reset URL menggunakan FRONTEND_URL env var
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://taraalsyah.online';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // 6. Kirim email berisi link reset password (bukan OTP)
    const result = await emailService.sendForgotPasswordEmail(user.email, user.name, resetUrl);
    if (!result.success) {
      console.error('[password-reset] Gagal kirim email:', result.message);
    }

    return { success: true };
  }

  async validateResetToken(token: string) {
    if (!token) {
      const error = new Error('Token wajib disediakan.');
      (error as any).status = 400;
      throw error;
    }

    const hashed = hashToken(token);

    // Cari token di database
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: hashed,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      const error = new Error('Link reset password tidak valid atau telah kedaluwarsa.');
      (error as any).status = 400;
      throw error;
    }

    return {
      token: resetToken,
      user: resetToken.user,
    };
  }

  async resetUserPassword(token: string, passwordText: string) {
    // 1. Validasi token dan dapatkan datanya
    const { token: dbToken, user } = await this.validateResetToken(token);

    // 2. Hash password baru
    const hashedPassword = await bcrypt.hash(passwordText, 10);

    // 3. Update database menggunakan transaction
    await prisma.$transaction(async (tx) => {
      // Update password user
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });

      // Tandai token reset ini sebagai telah digunakan
      await tx.passwordResetToken.update({
        where: { id: dbToken.id },
        data: {
          usedAt: new Date(),
        },
      });

      // Nonaktifkan semua token reset password tersisa milik user ini
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          expiresAt: new Date(),
        },
      });
    });

    return { success: true };
  }
}

export const passwordResetService = new PasswordResetService();
export default passwordResetService;
