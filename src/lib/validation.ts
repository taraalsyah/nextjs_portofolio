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

export type RegisterInput = z.infer<typeof registerSchema>;
