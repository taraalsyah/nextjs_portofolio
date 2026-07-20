import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logProfileChange } from '@/lib/activity';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

// ─── VALIDASI SCHEMA ──────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(3, 'Nama Lengkap minimal 3 karakter').max(100, 'Nama Lengkap maksimal 100 karakter'),
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(30, 'Username maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore (_)'),
  phone: z.string()
    .optional()
    .refine(val => !val || /^[0-9]+$/.test(val), 'Nomor telepon hanya boleh berisi angka')
    .refine(val => !val || val.length <= 20, 'Nomor telepon maksimal 20 digit'),
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

// ─── GET /api/profile ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/profile Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);

    // Ambil data dalam bentuk FormData untuk menangani file upload
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const phone = formData.get('phone') as string || undefined;
    const avatarFile = formData.get('avatar') as File | null;

    // 1. Validasi Zod untuk field teks
    const validation = profileSchema.safeParse({ name, username, phone });
    if (!validation.success) {
      return NextResponse.json({
        message: validation.error.issues[0].message
      }, { status: 400 });
    }

    // 2. Cari user di database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    }) as any;

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });
    }

    // 3. Validasi keunikan username (jika diubah)
    if (username !== user.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (usernameExists) {
        return NextResponse.json({ message: 'Username sudah digunakan.' }, { status: 409 });
      }
    }

    let avatarPath = user.image;

    // 4. Proses upload avatar jika ada file baru
    if (avatarFile && avatarFile.size > 0) {
      // Validasi tipe file
      if (!ALLOWED_MIME_TYPES.includes(avatarFile.type)) {
        return NextResponse.json({ message: 'Format foto harus berupa JPG, JPEG, PNG, atau WEBP.' }, { status: 400 });
      }

      // Validasi ukuran file
      if (avatarFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ message: 'Ukuran foto maksimal adalah 2 MB.' }, { status: 400 });
      }

      // Pastikan direktori upload ada
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate nama file unik
      const ext = path.extname(avatarFile.name) || '.png';
      const fileName = `avatar-${userId}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Konversi File ke Buffer dan tulis ke filesystem
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);

      // Hapus foto profil lama jika ada
      if (user.image && user.image.replace(/^\//, '').startsWith('uploads/avatars/')) {
        const oldFilePath = path.join(process.cwd(), 'public', user.image.replace(/^\//, ''));
        try {
          await fs.unlink(oldFilePath);
        } catch (unlinkError) {
          console.warn('Gagal menghapus file avatar lama:', unlinkError);
        }
      }

      avatarPath = `/uploads/avatars/${fileName}`;
    }

    // 5. Update data di database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        phone: phone || null,
        image: avatarPath,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    // 6. Catat aktivitas perubahan profil ke activity_logs
    try {
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '127.0.0.1';
      await logProfileChange(userId, user, updatedUser, ipAddress, userAgent);
    } catch (logError) {
      console.warn('Gagal mencatat log aktivitas:', logError);
    }

    // Invalidate Server Component router caches
    try {
      revalidatePath('/dashboard/profile');
      revalidatePath('/dashboard');
    } catch (revalError) {
      console.warn('Gagal melakukan revalidatePath:', revalError);
    }

    return NextResponse.json({
      success: true,
      message: 'Informasi profil berhasil diperbarui.',
      user: updatedUser
    }, { status: 200 });

  } catch (error: any) {
    console.error('PUT /api/profile Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
