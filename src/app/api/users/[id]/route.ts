import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiPermission } from '@/lib/apiHelper';
import { createActivityLog } from '@/lib/activity';

// ─── PUT /api/users/[id] (Update User Role) ────────────────────────────────────
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiPermission(request, 'User Management', 'Update');
  if (!auth.authorized) return auth.response!;

  try {
    const params = await props.params;
    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ message: 'ID User tidak valid.' }, { status: 400 });
    }

    const body = await request.json();
    const { roleId } = body;

    const newRoleId = parseInt(roleId, 10);
    if (isNaN(newRoleId)) {
      return NextResponse.json({ message: 'ID Role tidak valid.' }, { status: 400 });
    }

    // Dapatkan user target
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { roleRel: true },
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Dapatkan role baru
    const newRole = await prisma.role.findUnique({
      where: { id: newRoleId },
    });

    if (!newRole) {
      return NextResponse.json({ message: 'Role tidak ditemukan.' }, { status: 404 });
    }

    // Lakukan update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        roleId: newRoleId,
        role: newRole.name, // compatibility
      },
    });

    // Catat log audit ke Activity History
    await createActivityLog({
      userId: auth.userId!,
      action: 'UPDATE',
      description: `User "${targetUser.name}" role changed to ${newRole.name}`,
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// ─── DELETE /api/users/[id] (Delete User) ───────────────────────────────────────
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiPermission(request, 'User Management', 'Delete');
  if (!auth.authorized) return auth.response!;

  try {
    const params = await props.params;
    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ message: 'ID User tidak valid.' }, { status: 400 });
    }

    // Validasi agar tidak menghapus diri sendiri
    if (targetUserId === auth.userId) {
      return NextResponse.json({ message: 'Tidak dapat menghapus akun sendiri yang sedang digunakan.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Hapus user
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    // Catat log audit ke Activity History
    await createActivityLog({
      userId: auth.userId!,
      action: 'DELETE',
      description: `User "${targetUser.name}" deleted`,
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent,
    });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus.' }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
