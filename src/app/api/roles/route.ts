import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiPermission } from '@/lib/apiHelper';
import { createActivityLog } from '@/lib/activity';

// ─── GET /api/roles ───────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const auth = await verifyApiPermission(request, 'Role Management', 'View');
  if (!auth.authorized) return auth.response!;

  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const permissions = await prisma.permission.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ success: true, roles, permissions }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/roles error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// ─── POST /api/roles (Add Role) ────────────────────────────────────────────────
export async function POST(request: Request) {
  const auth = await verifyApiPermission(request, 'Role Management', 'Create');
  if (!auth.authorized) return auth.response!;

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ message: 'Nama Role minimal 3 karakter.' }, { status: 400 });
    }

    // Cek duplikasi nama role
    const exists = await prisma.role.findUnique({
      where: { name: name.trim() },
    });

    if (exists) {
      return NextResponse.json({ message: 'Nama role sudah digunakan.' }, { status: 409 });
    }

    const newRole = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    // Catat log aktivitas audit
    await createActivityLog({
      userId: auth.userId!,
      action: 'CREATE',
      description: `Role "${newRole.name}" created`,
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, role: newRole }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/roles error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// ─── PUT /api/roles (Edit Role) ─────────────────────────────────────────────────
export async function PUT(request: Request) {
  const auth = await verifyApiPermission(request, 'Role Management', 'Update');
  if (!auth.authorized) return auth.response!;

  try {
    const body = await request.json();
    const { id, name, description } = body;

    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ message: 'ID Role tidak valid.' }, { status: 400 });
    }

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ message: 'Nama Role minimal 3 karakter.' }, { status: 400 });
    }

    const currentRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!currentRole) {
      return NextResponse.json({ message: 'Role tidak ditemukan.' }, { status: 404 });
    }

    // Cek duplikasi nama jika diubah
    if (name.trim() !== currentRole.name) {
      const exists = await prisma.role.findUnique({
        where: { name: name.trim() },
      });
      if (exists) {
        return NextResponse.json({ message: 'Nama role sudah digunakan.' }, { status: 409 });
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    // Catat log aktivitas audit
    await createActivityLog({
      userId: auth.userId!,
      action: 'UPDATE',
      description: `Role "${currentRole.name}" updated`,
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, role: updatedRole }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/roles error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// ─── DELETE /api/roles (Delete Role) ──────────────────────────────────────────────
export async function DELETE(request: Request) {
  const auth = await verifyApiPermission(request, 'Role Management', 'Delete');
  if (!auth.authorized) return auth.response!;

  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    const roleId = parseInt(idParam || '', 10);

    if (isNaN(roleId)) {
      return NextResponse.json({ message: 'ID Role tidak valid.' }, { status: 400 });
    }

    const currentRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!currentRole) {
      return NextResponse.json({ message: 'Role tidak ditemukan.' }, { status: 404 });
    }

    // Validasi agar role tidak sedang digunakan oleh user mana pun
    const userCount = await prisma.user.count({
      where: { roleId },
    });

    if (userCount > 0) {
      return NextResponse.json(
        { message: 'Role masih digunakan oleh beberapa user.' },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    // Catat log aktivitas audit
    await createActivityLog({
      userId: auth.userId!,
      action: 'DELETE',
      description: `Role "${currentRole.name}" deleted`,
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, message: 'Role berhasil dihapus.' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/roles error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
