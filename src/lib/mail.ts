import nodemailer from 'nodemailer';

// ─── Singleton Transporter ────────────────────────────────────────────────────
// Dibuat sekali saja saat module pertama kali di-import (singleton pattern)
// agar koneksi SMTP tidak dibuat ulang pada setiap request.
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_SERVER;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      'Konfigurasi SMTP belum lengkap. Pastikan SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, dan SMTP_PASSWORD sudah diset di environment variable.'
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // false = STARTTLS pada port 587 (Zoho SMTP)
    auth: { user, pass },
    tls: {
      // Izinkan self-signed cert jika diperlukan (lebih toleran di berbagai env)
      rejectUnauthorized: false,
    },
  });

  return _transporter;
}

// Ekspor transporter untuk kebutuhan test/manual verify
export const transporter = new Proxy({} as nodemailer.Transporter, {
  get(_target, prop) {
    return (getTransporter() as any)[prop];
  },
});

// ─── verifySMTP ───────────────────────────────────────────────────────────────
/**
 * Verifikasi koneksi SMTP. Digunakan pada development dan endpoint /api/test-email.
 */
export async function verifySMTP(): Promise<{ success: boolean; message: string }> {
  try {
    await getTransporter().verify();
    const msg = 'SMTP berhasil terhubung ke ' + process.env.SMTP_SERVER;
    console.log('[mail.ts] ' + msg);
    return { success: true, message: msg };
  } catch (error: any) {
    const msg = error?.message || 'Gagal terhubung ke server SMTP.';
    console.error('[mail.ts] SMTP verify failed:', msg);
    return { success: false, message: msg };
  }
}

// Auto-verify di development
if (process.env.NODE_ENV !== 'production') {
  verifySMTP().catch(() => {});
}

// ─── Interface ────────────────────────────────────────────────────────────────
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
}

// ─── sendEmail ────────────────────────────────────────────────────────────────
/**
 * Fungsi inti pengiriman email melalui Zoho SMTP.
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const from = `"Tara Alsyah" <${process.env.SMTP_USERNAME}>`;

  try {
    const info = await getTransporter().sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    console.log('[mail.ts] Email terkirim:', info.messageId);
    return { success: true, message: 'Email berhasil dikirim.' };
  } catch (error: any) {
    const msg = error?.message || 'Gagal mengirim email.';
    console.error('[mail.ts] sendEmail error:', msg);
    return { success: false, message: msg };
  }
}
