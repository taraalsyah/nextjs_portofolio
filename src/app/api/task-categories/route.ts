import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const categories = await prisma.taskCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const role = (session.user as any).role || 'Staff';
    if (role !== 'Admin') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Admin yang dapat mengelola kategori.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 });
    }

    const existing = await prisma.taskCategory.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan.' }, { status: 400 });
    }

    const category = await prisma.taskCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    const userId = parseInt((session.user as any).id, 10);
    await createActivityLog({
      userId,
      action: 'CREATE',
      description: `Menambahkan Kategori Task: "${category.name}"`,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
