import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';
import { getCachedCategories, setCachedCategories, invalidateCategoriesCache } from '@/lib/category-cache';
import { getActiveProjectContext } from '@/lib/active-project';
import { getProjectMember } from '@/lib/project';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const searchParams = req.nextUrl.searchParams;
    let targetProjectId: number | null = null;

    const queryProjectId = searchParams.get('projectId');
    if (queryProjectId) {
      const parsed = parseInt(queryProjectId, 10);
      if (!isNaN(parsed) && parsed > 0) {
        targetProjectId = parsed;
      }
    }

    // Fallback to active project if no explicit projectId parameter
    if (!targetProjectId) {
      const activeCtx = await getActiveProjectContext(userId, session.user.name || undefined, req);
      if (activeCtx) {
        targetProjectId = activeCtx.projectId;
      }
    }

    if (!targetProjectId) {
      return NextResponse.json({ categories: [] });
    }

    // Verify user membership in project
    const member = await getProjectMember(targetProjectId, userId);
    const sysRole = (session.user as any).role || '';
    const isAdmin = sysRole === 'admin' || sysRole === 'Admin' || sysRole === 'ADMIN' || sysRole === 'superadmin';

    if (!member && !isAdmin) {
      return NextResponse.json({ error: 'Akses ditolak. Anda bukan anggota project ini.' }, { status: 403 });
    }

    // 1. Try fetching Categories from Redis Read-Cache for this project
    const cachedCategories = await getCachedCategories(targetProjectId);
    if (cachedCategories) {
      return NextResponse.json({ categories: cachedCategories });
    }

    // 2. Cache MISS / Redis Unavailable: Query MySQL (Source of Truth)
    const categories = await prisma.taskCategory.findMany({
      where: { projectId: targetProjectId },
      orderBy: { name: 'asc' },
    });

    // 3. Populate Redis Cache asynchronously / safely
    await setCachedCategories(categories, targetProjectId);

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

    const userId = parseInt((session.user as any).id, 10);
    const body = await req.json();
    const { name, description, projectId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi.' }, { status: 400 });
    }

    let targetProjectId = projectId ? parseInt(String(projectId), 10) : null;
    if (!targetProjectId || isNaN(targetProjectId)) {
      const activeCtx = await getActiveProjectContext(userId, session.user.name || undefined, req);
      if (activeCtx) {
        targetProjectId = activeCtx.projectId;
      }
    }

    if (!targetProjectId) {
      return NextResponse.json({ error: 'Project ID wajib ditentukan.' }, { status: 400 });
    }

    // Validate membership and project permission
    const member = await getProjectMember(targetProjectId, userId);
    const sysRole = (session.user as any).role || '';
    const isSysAdmin = sysRole === 'admin' || sysRole === 'Admin' || sysRole === 'ADMIN' || sysRole === 'superadmin';

    if (!member && !isSysAdmin) {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak memiliki akses ke project ini.' }, { status: 403 });
    }

    const memberRole = member?.role || 'VIEWER';
    if (!isSysAdmin && memberRole !== 'OWNER' && memberRole !== 'ADMIN' && memberRole !== 'MEMBER') {
      return NextResponse.json({ error: 'Akses ditolak. Peran Anda di project ini tidak dapat menambah kategori.' }, { status: 403 });
    }

    const existing = await prisma.taskCategory.findFirst({
      where: {
        projectId: targetProjectId,
        name: name.trim(),
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan pada project ini.' }, { status: 400 });
    }

    // 1. Save to MySQL first (Source of Truth)
    const category = await prisma.taskCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        projectId: targetProjectId,
      },
    });

    // 2. Invalidate Redis Cache after MySQL success
    await invalidateCategoriesCache(targetProjectId);

    await createActivityLog({
      userId,
      action: 'CREATE',
      description: `Menambahkan Kategori Task: "${category.name}" pada Project ID: ${targetProjectId}`,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

