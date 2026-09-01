import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';
import { invalidateCategoriesCache } from '@/lib/category-cache';
import { getProjectMember } from '@/lib/project';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const { id } = await params;
    const catId = parseInt(id, 10);
    if (isNaN(catId)) {
      return NextResponse.json({ error: 'ID Kategori tidak valid.' }, { status: 400 });
    }

    const categoryToUpdate = await prisma.taskCategory.findUnique({
      where: { id: catId },
    });

    if (!categoryToUpdate) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    // Check project permission / ownership
    const targetProjectId = categoryToUpdate.projectId;
    const sysRole = (session.user as any).role || '';
    const isSysAdmin = sysRole === 'admin' || sysRole === 'Admin' || sysRole === 'ADMIN' || sysRole === 'superadmin';

    if (targetProjectId) {
      const member = await getProjectMember(targetProjectId, userId);
      if (!member && !isSysAdmin) {
        return NextResponse.json({ error: 'Akses ditolak. Anda tidak memiliki akses ke project ini.' }, { status: 403 });
      }
      const memberRole = member?.role || 'VIEWER';
      if (!isSysAdmin && memberRole !== 'OWNER' && memberRole !== 'ADMIN' && memberRole !== 'MEMBER') {
        return NextResponse.json({ error: 'Akses ditolak. Peran Anda di project ini tidak dapat mengubah kategori.' }, { status: 403 });
      }
    } else if (!isSysAdmin) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 });
    }

    const existingName = await prisma.taskCategory.findFirst({
      where: {
        projectId: targetProjectId,
        name: name.trim(),
        NOT: { id: catId },
      },
    });

    if (existingName) {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan pada project ini.' }, { status: 400 });
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
    await invalidateCategoriesCache(targetProjectId || undefined);

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

    const userId = parseInt((session.user as any).id, 10);
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

    // Check project permission / ownership
    const targetProjectId = category.projectId;
    const sysRole = (session.user as any).role || '';
    const isSysAdmin = sysRole === 'admin' || sysRole === 'Admin' || sysRole === 'ADMIN' || sysRole === 'superadmin';

    if (targetProjectId) {
      const member = await getProjectMember(targetProjectId, userId);
      if (!member && !isSysAdmin) {
        return NextResponse.json({ error: 'Akses ditolak. Anda tidak memiliki akses ke project ini.' }, { status: 403 });
      }
      const memberRole = member?.role || 'VIEWER';
      if (!isSysAdmin && memberRole !== 'OWNER' && memberRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Akses ditolak. Hanya Owner atau Admin project yang dapat menghapus kategori.' }, { status: 403 });
      }
    } else if (!isSysAdmin) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // 1. Delete from MySQL (Source of Truth)
    await prisma.taskCategory.delete({
      where: { id: catId },
    });

    // 2. Invalidate Redis Cache after MySQL success
    await invalidateCategoriesCache(targetProjectId || undefined);

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

