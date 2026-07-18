import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    // Validasi input sederhana
    if (!to || !subject || !html) {
      return NextResponse.json(
        { message: 'Kolom "to", "subject", dan "html" wajib diisi.' },
        { status: 400 }
      );
    }

    // Kirim email
    const info = await sendEmail({ to, subject, html });

    return NextResponse.json(
      { 
        message: 'Email berhasil terkirim.',
        messageId: info.messageId 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API Send Email Error:', error);
    return NextResponse.json(
      { 
        message: 'Gagal mengirim email.',
        error: error.message || error 
      },
      { status: 500 }
    );
  }
}
