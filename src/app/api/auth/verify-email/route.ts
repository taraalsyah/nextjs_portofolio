import { NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { verifyEmailSchema } from '@/validators/auth';

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

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

    // 2. Verifikasi OTP dengan metadata IP dan User-Agent
    const result = await authService.verifyOTP(email, code, { ipAddress, userAgent });

    return NextResponse.json(
      { message: result.message || 'Verifikasi berhasil. Silakan login.' },
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
