import { NextResponse } from 'next/server';
import { passwordResetService } from '@/lib/password-reset';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validasi input email
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Validasi input gagal.', 
          errors: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    
    // Dapatkan IP dan User Agent pembaca untuk keamanan
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // 2. Buat token dan kirim email
    await passwordResetService.createResetToken(email, ipAddress, userAgent);

    return NextResponse.json(
      { 
        success: true,
        message: 'Jika email terdaftar, kami telah mengirimkan link reset password.' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot Password API Error:', error);

    const status = error.status || 500;
    
    // Tampilkan pesan error jika itu adalah rate limit / cooldown (429)
    if (status === 429) {
      return NextResponse.json(
        { 
          success: false,
          message: error.message 
        },
        { status: 429 }
      );
    }

    // Selalu kembalikan respon sukses jika error internal lain agar menghindari email enumeration
    return NextResponse.json(
      { 
        success: true,
        message: 'Jika email terdaftar, kami telah mengirimkan link reset password.' 
      },
      { status: 200 }
    );
  }
}
