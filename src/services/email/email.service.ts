import { sendEmail, EmailResult } from '@/lib/mail';

// ─── HTML Templates ──────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="background:#2563eb;padding:36px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🚀 Tara Alsyah
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Portofolio &amp; Web Development</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f8fa;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                ⚠️ <strong>Jangan pernah membagikan kode OTP kepada siapa pun.</strong><br/>
                Email ini dikirim secara otomatis. Jangan membalas email ini.<br/>
                &copy; ${new Date().getFullYear()} Tasktuntas &mdash; tasktuntas.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function otpBlock(otp: string): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;font-size:40px;font-weight:800;letter-spacing:12px;color:#2563eb;background-color:#eef2ff;padding:16px 32px;border-radius:12px;border:2px dashed #1E40AF;">
        ${otp}
      </span>
    </div>
    <p style="text-align:center;font-size:13px;color:#6b7280;margin:0 0 8px;">
      Kode OTP ini berlaku selama <strong>10 menit</strong> dan hanya dapat digunakan <strong>satu kali</strong>.
    </p>`;
}

// ─── EmailService ─────────────────────────────────────────────────────────────
export class EmailService {

  /**
   * Kirim email verifikasi OTP saat registrasi.
   */
  async sendVerificationEmail(email: string, name: string, otp: string): Promise<EmailResult> {
    const subject = 'Verifikasi Email Akun Anda';

    const body = `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Verifikasi Email Anda</h2>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
        Halo <strong>${name}</strong>, selamat datang! 👋
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
        Untuk menyelesaikan proses registrasi, masukkan kode OTP berikut di halaman verifikasi:
      </p>
      ${otpBlock(otp)}
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Jika Anda tidak merasa mendaftar, abaikan email ini.
      </p>`;

    return sendEmail({ to: email, subject, html: baseTemplate(subject, body) });
  }

  /**
   * Kirim OTP generik (resend verification atau flow lain).
   */
  async sendOTPEmail(email: string, name: string, otp: string): Promise<EmailResult> {
    const subject = 'Kode OTP Anda';

    const body = `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Kode OTP Baru</h2>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
        Halo <strong>${name}</strong>, berikut adalah kode OTP baru untuk akun Anda:
      </p>
      ${otpBlock(otp)}
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Jika Anda tidak meminta kode ini, abaikan email ini.
      </p>`;

    return sendEmail({ to: email, subject, html: baseTemplate(subject, body) });
  }

  /**
   * Kirim email reset password (forgot password flow via secure link).
   * @param resetLink - URL lengkap: https://domain.com/reset-password?token=xxx
   */
  async sendForgotPasswordEmail(email: string, name: string, resetLink: string): Promise<EmailResult> {
    const subject = 'Reset Password Akun Anda';

    const body = `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Permintaan Reset Password</h2>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px;">
        Halo <strong>${name}</strong>,
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 28px;">
        Kami menerima permintaan untuk menyetel ulang password akun Anda.
        Silakan klik tombol di bawah ini untuk membuat password baru.
      </p>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <a href="${resetLink}"
               style="display:inline-block;background:#2563eb;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
              🔐 Reset Password
            </a>
          </td>
        </tr>
      </table>

      <!-- Fallback link -->
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 4px;">
        Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut ke browser Anda:
      </p>
      <p style="font-size:12px;word-break:break-all;margin:0 0 24px;">
        <a href="${resetLink}" style="color:#2563eb;">${resetLink}</a>
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#fef9c3;border:1px solid #fde047;border-radius:8px;margin:0 0 24px;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
              ⏱ Link ini hanya berlaku selama <strong>10 menit</strong> dan hanya dapat digunakan <strong>satu kali</strong>.
            </p>
          </td>
        </tr>
      </table>

      <hr style="border:0;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
      </p>`;

    return sendEmail({ to: email, subject, html: baseTemplate(subject, body) });
  }

  /**
   * Kirim email notifikasi task overdue.
   */
  async sendOverdueTaskEmail(params: {
    to: string;
    recipientName: string;
    taskNumber: string;
    taskTitle: string;
    assigneeName: string;
    ownerName: string;
    dueDate: string;
    status: string;
    taskDetailUrl: string;
  }): Promise<EmailResult> {
    const subject = `[Task Overdue] Task "${params.taskTitle}" telah melewati deadline`;

    const body = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#dc2626;">⚠️ Pemberitahuan Task Overdue</h2>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
        Halo <strong>${params.recipientName}</strong>,
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
        Task berikut telah <strong>melewati batas waktu (due date)</strong> dan memerlukan perhatian atau tindak lanjut segera:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:0 0 24px;">
        <tr>
          <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#1f2937;">
              <tr>
                <td style="padding:4px 0;width:120px;color:#6b7280;font-weight:600;">Task ID:</td>
                <td style="padding:4px 0;font-weight:700;color:#dc2626;">${params.taskNumber}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-weight:600;">Judul Task:</td>
                <td style="padding:4px 0;font-weight:600;color:#111827;">${params.taskTitle}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-weight:600;">Due Date:</td>
                <td style="padding:4px 0;font-weight:700;color:#b91c1c;">${params.dueDate}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-weight:600;">Status:</td>
                <td style="padding:4px 0;font-weight:600;color:#4b5563;">${params.status}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-weight:600;">Assignee:</td>
                <td style="padding:4px 0;">${params.assigneeName}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-weight:600;">Task Owner:</td>
                <td style="padding:4px 0;">${params.ownerName}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <a href="${params.taskDetailUrl}"
               style="display:inline-block;background:#dc2626;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:10px;">
              📋 Lihat Detail Task
            </a>
          </td>
        </tr>
      </table>

      <hr style="border:0;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Harap segera perbarui status task atau selesaikan pekerjaan yang ditugaskan.
      </p>`;

    return sendEmail({ to: params.to, subject, html: baseTemplate(subject, body) });
  }

  /**
   * Kirim OTP untuk Two-Step Verification saat login.
   */
  async sendTwoFactorOtpEmail(email: string, name: string, otp: string): Promise<EmailResult> {
    const subject = '[Kode Keamanan 2FA] Verifikasi Login Akun Anda';

    const body = `
      <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Verifikasi Login (Two-Step Verification)</h2>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
        Halo <strong>${name}</strong>,
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
        Gunakan kode keamanan OTP 6 digit berikut untuk menyelesaikan proses login Anda:
      </p>
      ${otpBlock(otp)}
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
        Kode ini berlaku selama <strong>5 menit</strong>. Jangan pernah memberitahukan kode ini kepada siapa pun. Jika Anda tidak merasa melakukan percobaan login, segera perbarui password akun Anda.
      </p>`;

    return sendEmail({ to: email, subject, html: baseTemplate(subject, body) });
  }
}

export const emailService = new EmailService();
export default emailService;
