import { NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { verifyEmailSchema } from '@/validators/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validasi input menggunakan Zod
    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Validasi input gagal.', 
          errors: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { email, code } = validation.data;

    // 2. Verifikasi OTP
    await authService.verifyOTP(email, code);

    return NextResponse.json(
      { message: 'Verifikasi berhasil. Silakan login.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify Email API Error:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Terjadi server error.';

    return NextResponse.json(
      { message },
      { status }
    );
  }
}
