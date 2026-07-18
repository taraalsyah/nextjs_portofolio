import { NextResponse } from 'next/server';
import { passwordResetService } from '@/lib/password-reset';
import { z } from 'zod';

const schema = z
  .object({
    token: z.string().min(1, { message: 'Token wajib disediakan' }),
    password: z
      .string()
      .min(8, { message: 'Password minimal terdiri dari 8 karakter' })
      .regex(/[A-Z]/, { message: 'Password harus mengandung minimal 1 huruf besar' })
      .regex(/[a-z]/, { message: 'Password harus mengandung minimal 1 huruf kecil' })
      .regex(/[0-9]/, { message: 'Password harus mengandung minimal 1 angka' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password harus mengandung minimal 1 karakter spesial' }),
    confirmPassword: z.string().min(1, { message: 'Konfirmasi password wajib diisi' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password harus sama dengan password',
    path: ['confirmPassword'],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validasi input menggunakan Zod
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

    const { token, password } = validation.data;

    // 2. Setel ulang password
    await passwordResetService.resetUserPassword(token, password);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password berhasil diubah. Silakan login menggunakan password baru.' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reset Password API Error:', error);

    const status = error.status || 500;
    const message = error.message || 'Terjadi server error.';

    return NextResponse.json(
      { 
        success: false, 
        message 
      },
      { status }
    );
  }
}
