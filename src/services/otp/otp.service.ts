import { prisma } from '@/lib/prisma';
import { generateOTP } from '@/utils/otp';
import { emailService } from '../email/email.service';
import {
  addHoursUTC,
  addMinutesUTC,
  getRemainingTimeString,
  getSecondsSince,
  isExpired,
  getNowUTC,
} from '@/lib/date';

export interface RequestMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class OtpService {
  /**
   * Helper to format remaining soft block duration string in Indonesian.
   */
  getRemainingSoftBlockTime(softBlockUntil: Date): string {
    return getRemainingTimeString(softBlockUntil);
  }

  /**
   * 6. Verifikasi OTP dengan proteksi Soft Block (5 failed attempts per OTP)
   * dan Permanent Block (3 Soft Blocks -> BLOCKED status).
   */
  async verifyOTP(email: string, code: string, meta?: RequestMeta) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('User tidak ditemukan.');
      (error as any).status = 404;
      throw error;
    }

    // 1. Pastikan user belum BLOCKED
    if (user.status === 'BLOCKED') {
      const error = new Error('Akun telah diblokir. Silakan hubungi Administrator.');
      (error as any).status = 403;
      throw error;
    }

    // 2. Pastikan user masih berstatus PENDING
    if (user.status === 'ACTIVE') {
      const error = new Error('Akun sudah terverifikasi. Silakan login.');
      (error as any).status = 400;
      throw error;
    }

    // 3. Periksa apakah user sedang dalam masa Soft Block (3 jam)
    if (user.otpSoftBlockUntil && !isExpired(user.otpSoftBlockUntil)) {
      const remaining = this.getRemainingSoftBlockTime(user.otpSoftBlockUntil);
      const error = new Error(
        `Akun ditangguhkan sementara selama 3 jam karena terlalu banyak percobaan OTP yang gagal. Sisa waktu: ${remaining}.`
      );
      (error as any).status = 429;
      throw error;
    }

    // 4. Ambil OTP aktif dari MySQL
    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
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

    // 5. Cek apakah OTP kedaluwarsa (10 menit)
    if (isExpired(verification.expiredAt)) {
      const error = new Error('Kode verifikasi telah kedaluwarsa.');
      (error as any).status = 400;
      throw error;
    }

    // 6. Cek kecocokan OTP
    if (verification.code !== code) {
      // PROSES OTP SALAH (Per pengiriman OTP, max 5 kali)
      const result = await prisma.$transaction(async (tx) => {
        const nextAttemptCount = user.otpAttemptCount + 1;

        if (nextAttemptCount >= 5) {
          // Gagal 5 kali pada OTP ini -> Hapus OTP aktif
          await tx.emailVerification.deleteMany({
            where: { userId: user.id },
          });

          const nextSoftBlockCount = user.otpSoftBlockCount + 1;

          if (nextSoftBlockCount >= 3) {
            // Pengguna mengalami 3 kali Soft Block -> PERMANENT BLOCK
            await tx.user.update({
              where: { id: user.id },
              data: {
                status: 'BLOCKED',
                otpAttemptCount: 0,
                otpSoftBlockCount: nextSoftBlockCount,
                otpSoftBlockUntil: null,
              },
            });

            await tx.activityLog.create({
              data: {
                userId: user.id,
                action: 'PERMANENT_BLOCK',
                description: 'User Permanently Blocked',
                ipAddress: meta?.ipAddress,
                userAgent: meta?.userAgent,
              },
            });

            return { isBlocked: true, isSoftBlocked: false };
          } else {
            // Aktifkan Soft Block selama 3 jam
            const softBlockUntil = addHoursUTC(3);
            await tx.user.update({
              where: { id: user.id },
              data: {
                otpAttemptCount: 0,
                otpSoftBlockCount: nextSoftBlockCount,
                otpSoftBlockUntil: softBlockUntil,
              },
            });

            await tx.activityLog.create({
              data: {
                userId: user.id,
                action: 'SOFT_BLOCK',
                description: `User Soft Blocked for 3 hours (Soft Block #${nextSoftBlockCount})`,
                ipAddress: meta?.ipAddress,
                userAgent: meta?.userAgent,
              },
            });

            return { isBlocked: false, isSoftBlocked: true, softBlockUntil };
          }
        } else {
          // Gagal belum mencapai 5 kali -> update counter
          await tx.user.update({
            where: { id: user.id },
            data: {
              otpAttemptCount: nextAttemptCount,
            },
          });

          await tx.activityLog.create({
            data: {
              userId: user.id,
              action: 'VERIFY_OTP',
              description: `OTP Verification Failed (Attempt ${nextAttemptCount}/5)`,
              ipAddress: meta?.ipAddress,
              userAgent: meta?.userAgent,
            },
          });

          return { isBlocked: false, isSoftBlocked: false, remainingAttempts: 5 - nextAttemptCount };
        }
      });

      if (result.isBlocked) {
        const error = new Error('Akun telah diblokir. Silakan hubungi Administrator.');
        (error as any).status = 403;
        throw error;
      }

      if (result.isSoftBlocked) {
        const remaining = this.getRemainingSoftBlockTime(result.softBlockUntil!);
        const error = new Error(
          `Akun ditangguhkan sementara selama 3 jam karena terlalu banyak percobaan OTP yang gagal. Sisa waktu: ${remaining}.`
        );
        (error as any).status = 429;
        throw error;
      }

      const error = new Error(`OTP tidak valid. Sisa percobaan: ${result.remainingAttempts} kali.`);
      (error as any).status = 400;
      throw error;
    }

    // 7. PROSES OTP BENAR -> AKUN JADI ACTIVE
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          emailVerifiedAt: getNowUTC(),
          otpAttemptCount: 0,
          otpSoftBlockUntil: null,
        },
      });

      // Automatic Personal Workspace Creation
      const { ensurePersonalWorkspace } = await import('@/lib/project');
      await ensurePersonalWorkspace(user.id, user.name, tx);

      // Hapus seluruh data OTP verifikasi terkait
      await tx.emailVerification.deleteMany({
        where: { userId: user.id },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'VERIFY_OTP',
          description: 'OTP Verification Success',
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });
    });

    return { success: true, message: 'Verifikasi berhasil. Silakan login.' };
  }

  /**
   * 7. Resend OTP
   */
  async resendOTP(email: string, meta?: RequestMeta) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('User tidak ditemukan.');
      (error as any).status = 404;
      throw error;
    }

    if (user.status === 'BLOCKED') {
      const error = new Error('Akun telah diblokir. Silakan hubungi Administrator.');
      (error as any).status = 403;
      throw error;
    }

    if (user.status === 'ACTIVE') {
      const error = new Error('Email Anda sudah terverifikasi.');
      (error as any).status = 400;
      throw error;
    }

    // Check soft block
    if (user.otpSoftBlockUntil && !isExpired(user.otpSoftBlockUntil)) {
      const remaining = this.getRemainingSoftBlockTime(user.otpSoftBlockUntil);
      const error = new Error(
        `Akun ditangguhkan sementara selama 3 jam karena terlalu banyak percobaan OTP yang gagal. Sisa waktu: ${remaining}.`
      );
      (error as any).status = 429;
      throw error;
    }

    // Cooldown check 60s
    const latestVerification = await prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestVerification) {
      const secondsSinceLast = getSecondsSince(latestVerification.createdAt);
      if (secondsSinceLast < 60) {
        const error = new Error('Kirim ulang kode hanya bisa dilakukan setelah 60 detik.');
        (error as any).status = 429;
        throw error;
      }
    }

    // Generate new OTP & expire time (10 min)
    const otpCode = generateOTP();
    const expiredAt = addMinutesUTC(10);

    await prisma.$transaction(async (tx) => {
      // Hapus OTP lama & reset counter percobaan
      await tx.emailVerification.deleteMany({
        where: { userId: user.id },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          otpAttemptCount: 0,
        },
      });

      await tx.emailVerification.create({
        data: {
          userId: user.id,
          code: otpCode,
          expiredAt,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'RESEND_OTP',
          description: 'OTP Resent',
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });
    });

    // Kirim email OTP baru
    try {
      await emailService.sendOTPEmail(user.email, user.name, otpCode);
    } catch (err) {
      console.error('Failed to send resent verification email:', err);
    }

    return { success: true, message: 'Kode verifikasi baru berhasil dikirim.' };
  }

  /**
   * 8. Admin Unblock User
   */
  async adminUnblockUser(adminUserId: number, targetUserId: number, meta?: RequestMeta) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      const error = new Error('User tidak ditemukan.');
      (error as any).status = 404;
      throw error;
    }

    if (targetUser.status !== 'BLOCKED') {
      const error = new Error('User tidak berstatus BLOCKED.');
      (error as any).status = 400;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: 'PENDING',
          otpSoftBlockCount: 0,
          otpAttemptCount: 0,
          otpSoftBlockUntil: null,
        },
      });

      await tx.emailVerification.deleteMany({
        where: { userId: targetUserId },
      });

      await tx.activityLog.create({
        data: {
          userId: adminUserId,
          action: 'UNBLOCK',
          description: `User Unblocked by Admin (Unblocked "${targetUser.name}")`,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });
    });

    return { success: true, message: 'Akun telah dibuka kembali oleh Administrator. Silakan lakukan pengiriman OTP kembali.' };
  }
}

export const otpService = new OtpService();
export default otpService;
