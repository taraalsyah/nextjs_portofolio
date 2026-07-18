import { NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { resendVerificationSchema } from '@/validators/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validasi input menggunakan Zod
    const validation = resendVerificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Validasi input gagal.', 
          errors: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // 2. Kirim ulang OTP
    await authService.resendOTP(email);

    return NextResponse.json(
      { message: 'Kode verifikasi baru berhasil dikirim.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Resend Verification API Error:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Terjadi server error.';

    return NextResponse.json(
      { message },
      { status }
    );
  }
}
