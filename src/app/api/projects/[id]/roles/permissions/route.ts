import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getProjectMember,
  getProjectFullPermissionMatrix,
  ALL_PERMISSIONS_LIST,
  ALL_WORKFLOW_TRANSITIONS,
  ProjectRole,
} from '@/lib/project';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    const currentUserId = parseInt((session.user as any).id || '0', 10);
    const membership = await getProjectMember(projectId, currentUserId);

    if (!membership) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke proyek ini.' }, { status: 403 });
    }

    const { matrix, workflowMatrix } = await getProjectFullPermissionMatrix(projectId);

    return NextResponse.json({
      matrix,
      workflowMatrix,
      permissionsList: ALL_PERMISSIONS_LIST,
      workflowTransitions: ALL_WORKFLOW_TRANSITIONS,
    });
  } catch (err: any) {
    console.error('GET /api/projects/[id]/roles/permissions error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    const currentUserId = parseInt((session.user as any).id || '0', 10);
    const membership = await getProjectMember(projectId, currentUserId);

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Hanya Owner atau Admin proyek yang dapat mengubah matriks izin peran.' }, { status: 403 });
    }

    const body = await req.json();
    const { matrix, workflowMatrix } = body;

    if (!matrix || !workflowMatrix) {
      return NextResponse.json({ error: 'Payload matriks izin tidak valid.' }, { status: 400 });
    }

    const roles: ProjectRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

    // Build bulk items to insert
    const rolePermissionItems: Array<{ projectId: number; role: string; permissionKey: string; isAllowed: boolean }> = [];
    const workflowPermissionItems: Array<{ projectId: number; role: string; fromStatus: string; toStatus: string; isAllowed: boolean }> = [];

    for (const r of roles) {
      if (matrix[r]) {
        for (const item of ALL_PERMISSIONS_LIST) {
          const permKey = item.key;
          const isAllowed = !!matrix[r][permKey];
          rolePermissionItems.push({
            projectId,
            role: r,
            permissionKey: permKey,
            isAllowed,
          });
        }
      }

      if (workflowMatrix[r]) {
        for (const trans of ALL_WORKFLOW_TRANSITIONS) {
          const key = `${trans.fromStatus}->${trans.toStatus}`;
          const isAllowed = !!workflowMatrix[r][key];
          workflowPermissionItems.push({
            projectId,
            role: r,
            fromStatus: trans.fromStatus,
            toStatus: trans.toStatus,
            isAllowed,
          });
        }
      }
    }

    // High performance transactional update with 30s timeout option
    await prisma.$transaction(
      async (tx) => {
        // 1. Delete existing custom permissions for this project
        await tx.projectRolePermission.deleteMany({
          where: { projectId },
        });

        await tx.projectWorkflowPermission.deleteMany({
          where: { projectId },
        });

        // 2. Bulk insert new permissions
        if (rolePermissionItems.length > 0) {
          await tx.projectRolePermission.createMany({
            data: rolePermissionItems,
          });
        }

        if (workflowPermissionItems.length > 0) {
          await tx.projectWorkflowPermission.createMany({
            data: workflowPermissionItems,
          });
        }

        // 3. Log Activity
        await tx.activityLog.create({
          data: {
            userId: currentUserId,
            projectId,
            action: 'ROLE_PERMISSIONS_UPDATED',
            description: `Role Permission Matrix Updated: Memperbarui Matriks Izin Peran Proyek oleh ${session.user?.name || 'User'}.`,
          },
        });
      },
      { timeout: 30000 }
    );

    return NextResponse.json({
      success: true,
      message: 'Matriks izin peran proyek berhasil diperbarui.',
    });
  } catch (err: any) {
    console.error('PUT /api/projects/[id]/roles/permissions error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
