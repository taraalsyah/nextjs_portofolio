import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(3, { message: 'Nama minimal terdiri dari 3 karakter' }),
    email: z.string().email({ message: 'Format email tidak valid' }),
    password: z
      .string()
      .min(8, { message: 'Password minimal terdiri dari 8 karakter' })
      .regex(/[A-Z]/, { message: 'Password harus mengandung minimal 1 huruf besar' })
      .regex(/[a-z]/, { message: 'Password harus mengandung minimal 1 huruf kecil' })
      .regex(/[0-9]/, { message: 'Password harus mengandung minimal 1 angka' }),
    confirmPassword: z.string().min(1, { message: 'Konfirmasi password wajib diisi' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password harus sama dengan password',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  code: z.string().length(6, { message: 'Kode OTP harus berupa 6 digit angka' }),
});

export const resendVerificationSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
