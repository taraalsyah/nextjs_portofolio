import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';
import { getCachedCategories, setCachedCategories, invalidateCategoriesCache } from '@/lib/category-cache';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    // 1. Try fetching Categories from Redis Read-Cache
    const cachedCategories = await getCachedCategories();
    if (cachedCategories) {
      return NextResponse.json({ categories: cachedCategories });
    }

    // 2. Cache MISS / Redis Unavailable: Query MySQL (Source of Truth)
    const categories = await prisma.taskCategory.findMany({
      orderBy: { name: 'asc' },
    });

    // 3. Populate Redis Cache asynchronously / safely
    await setCachedCategories(categories);

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

    // 1. Save to MySQL first (Source of Truth)
    const category = await prisma.taskCategory.create({
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
      action: 'CREATE',
      description: `Menambahkan Kategori Task: "${category.name}"`,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

