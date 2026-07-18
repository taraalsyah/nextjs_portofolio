import { sendEmail } from '@/lib/mail';

export class EmailService {
  async sendOTPEmail(email: string, name: string, code: string): Promise<void> {
    const subject = 'Kode Verifikasi OTP Anda';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fafafa;">
        <h2 style="color: #4f46e5; text-align: center;">Verifikasi Email Anda</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Terima kasih telah mendaftar di Portofolio. Untuk menyelesaikan proses registrasi, silakan masukkan kode verifikasi (OTP) berikut:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; padding: 10px 20px; border: 2px dashed #4f46e5; border-radius: 8px; background-color: #f5f3ff;">
            ${code}
          </span>
        </div>
        <p style="color: #666; font-size: 14px;">Kode OTP ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapapun.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Jika Anda tidak merasa melakukan pendaftaran ini, abaikan email ini.</p>
      </div>
    `;

    // Cek apakah SMTP Server dikonfigurasi
    const isSmtpConfigured = !!process.env.SMTP_SERVER;

    if (!isSmtpConfigured) {
      console.log('\n==================================================');
      console.log(`[EMAIL SERVICE - DEVELOPMENT FALLBACK]`);
      console.log(`Penerima: ${name} <${email}>`);
      console.log(`Subjek  : ${subject}`);
      console.log(`Kode OTP: ${code}`);
      console.log('==================================================\n');
      return;
    }

    await sendEmail({
      to: email,
      subject,
      html: htmlContent,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
