import { NextResponse } from 'next/server';
import { verifySMTP, sendEmail } from '@/lib/mail';

/**
 * POST /api/test-email
 * Endpoint testing: verifikasi koneksi SMTP Zoho dan kirim email percobaan.
 */
export async function POST(request: Request) {
  try {
    // 1. Verifikasi koneksi SMTP
    const verifyResult = await verifySMTP();

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'SMTP gagal terhubung.',
          error: verifyResult.message,
        },
        { status: 500 }
      );
    }

    // 2. Baca target email dari body (opsional), default ke SMTP_USERNAME
    let to = process.env.SMTP_USERNAME || '';
    try {
      const body = await request.json();
      if (body?.to && typeof body.to === 'string') to = body.to;
    } catch {
      // body kosong atau bukan JSON — tidak masalah
    }

    // 3. Kirim email percobaan
    const sendResult = await sendEmail({
      to,
      subject: 'Test Email – Zoho SMTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#3B82F6;margin:0 0 12px;">✅ Koneksi SMTP Berhasil!</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Email ini dikirmkan melalui <strong>Zoho SMTP</strong> pada:
          </p>
          <p style="color:#6b7280;font-size:14px;margin:0;">
            ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
          </p>
        </div>`,
      text: 'Test email dari Zoho SMTP berhasil terkirim.',
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'SMTP berhasil terhubung, namun gagal mengirim email.',
          error: sendResult.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'SMTP berhasil terhubung dan email berhasil dikirim.',
        sentTo: to,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/test-email error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi server error.',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
