import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiPermission } from '@/lib/apiHelper';
import { createActivityLog } from '@/lib/activity';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiPermission(request, 'Role Management', 'Update');
  if (!auth.authorized) return auth.response!;

  try {
    const params = await props.params;
    const roleId = parseInt(params.id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ message: 'ID Role tidak valid.' }, { status: 400 });
    }

    const { permissionIds } = await request.json();
    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ message: 'Data permissionIds harus berupa array.' }, { status: 400 });
    }

    // 1. Dapatkan info role bersangkutan
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ message: 'Role tidak ditemukan.' }, { status: 404 });
    }

    // 2. Dapatkan permission terdaftar saat ini
    const currentRPs = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    const currentPermissionIds = currentRPs.map((rp) => rp.permissionId);

    // 3. Tentukan perizinan yang diberikan (grant) atau dicabut (revoke)
    const toGrantIds = permissionIds.filter((pid) => !currentPermissionIds.includes(pid));
    const toRevokeRPs = currentRPs.filter((rp) => !permissionIds.includes(rp.permissionId));

    // Ambil info lengkap perizinan untuk logging
    const allPermissions = await prisma.permission.findMany();
    const permissionsMap = new Map(allPermissions.map((p) => [p.id, p]));

    // 4. Jalankan Prisma transaction untuk update perizinan
    await prisma.$transaction(async (tx) => {
      // Hapus perizinan yang dicabut
      if (toRevokeRPs.length > 0) {
        await tx.rolePermission.deleteMany({
          where: {
            id: { in: toRevokeRPs.map((rp) => rp.id) },
          },
        });
      }

      // Buat perizinan yang baru diberikan
      if (toGrantIds.length > 0) {
        await tx.rolePermission.createMany({
          data: toGrantIds.map((pid) => ({
            roleId,
            permissionId: pid,
          })),
        });
      }
    });

    // 5. Tulis log audit untuk setiap perubahan hak akses
    // Log perizinan yang dicabut
    for (const rp of toRevokeRPs) {
      const p = rp.permission;
      await createActivityLog({
        userId: auth.userId!,
        action: 'UPDATE',
        description: `Permission "${p.module} - ${p.action}" revoked from role ${role.name}`,
        ipAddress: auth.ipAddress,
        userAgent: auth.userAgent,
      });
    }

    // Log perizinan yang baru diberikan
    for (const pid of toGrantIds) {
      const p = permissionsMap.get(pid);
      if (p) {
        await createActivityLog({
          userId: auth.userId!,
          action: 'UPDATE',
          description: `Permission "${p.module} - ${p.action}" granted to role ${role.name}`,
          ipAddress: auth.ipAddress,
          userAgent: auth.userAgent,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Hak akses berhasil diperbarui.' }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/roles/[id]/permissions error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
