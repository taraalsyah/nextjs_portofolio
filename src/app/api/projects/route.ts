import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserProjects } from '@/lib/project';
import { ACTIVE_PROJECT_COOKIE } from '@/lib/active-project';
import { PROJECT_CREATION_FEE } from '@/services/payment/payment.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session.' }, { status: 401 });
    }

    const projects = await getUserProjects(userId);
    return NextResponse.json({ projects });
  } catch (err: any) {
    console.error('GET /api/projects error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session.' }, { status: 401 });
    }

    const body = await req.json();
    const { projectName, description, visibility = 'PRIVATE', paymentId, transactionId } = body;

    if (!projectName || !projectName.trim()) {
      return NextResponse.json({ error: 'Nama proyek wajib diisi.' }, { status: 400 });
    }
    if (projectName.trim().length > 100) {
      return NextResponse.json({ error: 'Nama proyek maksimal 100 karakter.' }, { status: 400 });
    }

    const targetPaymentId = transactionId || paymentId;

    // Strict payment validation on the backend
    if (!targetPaymentId) {
      return NextResponse.json(
        { error: 'Pembayaran diperlukan untuk membuat proyek baru. (Project Creation Fee: Rp30.000)' },
        { status: 402 }
      );
    }

    const validPayment = await prisma.projectPayment.findFirst({
      where: {
        OR: [{ transactionId: targetPaymentId }, { id: targetPaymentId }],
      },
    });

    if (!validPayment) {
      return NextResponse.json({ error: 'Transaksi pembayaran tidak ditemukan.' }, { status: 404 });
    }

    if (validPayment.userId !== userId) {
      return NextResponse.json({ error: 'Transaksi pembayaran ini milik akun lain.' }, { status: 403 });
    }

    if (validPayment.amount !== PROJECT_CREATION_FEE) {
      return NextResponse.json({ error: 'Nominal pembayaran tidak sesuai (Wajib Rp30.000).' }, { status: 400 });
    }

    if (validPayment.status !== 'PAID') {
      return NextResponse.json(
        { error: `Pembayaran belum dikonfirmasi (Status saat ini: ${validPayment.status}). Harap selesaikan pembayaran Rp30.000 terlebih dahulu.` },
        { status: 402 }
      );
    }

    if (validPayment.isUsed) {
      return NextResponse.json(
        { error: 'Pembayaran ini sudah pernah digunakan untuk membuat proyek lain.' },
        { status: 400 }
      );
    }

    const vis = visibility === 'TEAM' ? 'TEAM' : 'PRIVATE';

    // Prisma transaction: create Project, create Member as OWNER, mark Payment as used
    const project = await prisma.$transaction(
      async (tx) => {
        const created = await tx.project.create({
          data: {
            projectName: projectName.trim(),
            description: description?.trim() || null,
            ownerUserId: userId,
            visibility: vis,
          },
          select: {
            id: true,
            projectName: true,
            description: true,
            ownerUserId: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await tx.projectMember.create({
          data: {
            projectId: created.id,
            userId,
            role: 'OWNER',
          },
        });

        // Mark payment as used and attach to project
        await tx.projectPayment.update({
          where: { id: validPayment.id },
          data: {
            isUsed: true,
            usedForProjectId: created.id,
          },
        });

        await tx.activityLog.create({
          data: {
            userId,
            projectId: created.id,
            action: 'PROJECT_CREATED',
            description: `Membuat Proyek Baru: "${created.projectName}" (Fee Pembayaran Terverifikasi: Rp30.000)`,
          },
        });

        return created;
      },
      { timeout: 15000 }
    );

    const response = NextResponse.json({ project }, { status: 201 });
    // Set active project cookie to newly created project
    response.cookies.set(ACTIVE_PROJECT_COOKIE, String(project.id), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    console.error('POST /api/projects error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
