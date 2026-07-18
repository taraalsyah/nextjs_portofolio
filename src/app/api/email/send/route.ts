import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    // Validasi input sederhana
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, message: 'Kolom "to", "subject", dan "html" wajib diisi.' },
        { status: 400 }
      );
    }

    // Kirim email
    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: result.message },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API Send Email Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengirim email.', error: error.message || error },
      { status: 500 }
    );
  }
}
