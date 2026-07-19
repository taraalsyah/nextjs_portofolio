import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiPermission } from '@/lib/apiHelper';

// ─── GET /api/users ───────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const auth = await verifyApiPermission(request, 'User Management', 'View');
  if (!auth.authorized) return auth.response!;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        roleId: true,
        roleRel: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        status: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ success: true, users, roles }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
