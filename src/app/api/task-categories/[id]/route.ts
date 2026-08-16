import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';
import { invalidateCategoriesCache } from '@/lib/category-cache';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const role = (session.user as any).role || 'Staff';
    if (role !== 'Admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;
    const catId = parseInt(id, 10);
    if (isNaN(catId)) {
      return NextResponse.json({ error: 'ID Kategori tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 });
    }

    const existingName = await prisma.taskCategory.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: catId },
      },
    });

    if (existingName) {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan.' }, { status: 400 });
    }

    // 1. Update in MySQL (Source of Truth)
    const category = await prisma.taskCategory.update({
      where: { id: catId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    // 2. Invalidate Redis Cache after MySQL success
    await invalidateCategoriesCache();

    const userId = parseInt((session.user as any).id, 10);
    await createActivityLog({
      userId,
      action: 'UPDATE',
      description: `Mengubah Kategori Task: "${category.name}"`,
    });

    return NextResponse.json({ category });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const role = (session.user as any).role || 'Staff';
    if (role !== 'Admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { id } = await params;
    const catId = parseInt(id, 10);
    if (isNaN(catId)) {
      return NextResponse.json({ error: 'ID Kategori tidak valid.' }, { status: 400 });
    }

    const category = await prisma.taskCategory.findUnique({
      where: { id: catId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    // 1. Delete from MySQL (Source of Truth)
    await prisma.taskCategory.delete({
      where: { id: catId },
    });

    // 2. Invalidate Redis Cache after MySQL success
    await invalidateCategoriesCache();

    const userId = parseInt((session.user as any).id, 10);
    await createActivityLog({
      userId,
      action: 'DELETE',
      description: `Menghapus Kategori Task: "${category.name}"`,
    });

    return NextResponse.json({ message: 'Kategori berhasil dihapus.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

