import { prisma } from './prisma';
import { generateSecureToken, hashToken } from './token';
import { sendEmail } from './mail';
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
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // Berlaku 30 menit

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

    // 5. Kirim email berisi link reset password
    const baseUrl = 'https://taraalsyah.online';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #4f46e5; text-align: center;">Permintaan Reset Password</h2>
        <p>Halo <strong>${user.name}</strong>,</p>
        <p>Kami menerima permintaan untuk menyetel ulang password akun Anda. Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            Reset Password
          </a>
        </div>

        <p>Atau Anda juga dapat menggunakan link berikut jika tombol di atas tidak berfungsi:</p>
        <p style="word-break: break-all; color: #4f46e5;"><a href="${resetUrl}">${resetUrl}</a></p>

        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        
        <p style="color: #666; font-size: 13px;">Catatan Penting:</p>
        <ul style="color: #666; font-size: 13px; padding-left: 20px; line-height: 1.5;">
          <li>Link reset password ini hanya berlaku selama <strong>30 menit</strong>.</li>
          <li>Link ini hanya dapat digunakan <strong>satu kali</strong>.</li>
          <li>Jika Anda tidak merasa meminta reset password, abaikan email ini dengan aman. Password Anda tidak akan berubah.</li>
        </ul>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Password Akun Anda',
        html: htmlContent,
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
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
