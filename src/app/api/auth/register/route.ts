import { NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { registerSchema } from '@/validators/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validasi input menggunakan Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Validasi input gagal.', 
          errors: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // 2. Daftarkan user baru dan kirim kode verifikasi
    const user = await authService.registerUser(name, email, password);

    return NextResponse.json(
      {
        message: 'Registrasi berhasil. Silakan verifikasi email Anda.',
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration API Error:', error);
    
    const status = error.status || 500;
    const message = error.message || 'Terjadi server error.';

    return NextResponse.json(
      { message },
      { status }
    );
  }
}
