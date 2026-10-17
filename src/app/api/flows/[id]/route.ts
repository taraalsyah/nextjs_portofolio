import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveProjectContext } from '@/lib/active-project';
import { FlowService } from '@/services/flow/flow.service';
import { updateFlowSchema, validatePayloadSize } from '@/lib/flow/validation';
import { assertCanViewFlow, assertCanEditFlow } from '@/lib/flow/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    const { id } = await params;
    const flowId = parseInt(id, 10);
    if (isNaN(flowId) || flowId <= 0) {
      return NextResponse.json({ error: 'ID diagram tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);

    // 🔒 Authorization check: User must be a member of the project owning this flow
    const viewPerm = await assertCanViewFlow(sessionUserId, flowId);
    if (!viewPerm.allowed) {
      return NextResponse.json({ error: viewPerm.error }, { status: viewPerm.status });
    }

    const flow = await FlowService.getFlowById(flowId, viewPerm.projectId!);
    if (!flow) {
      return NextResponse.json({ error: 'Diagram alur tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ flow });
  } catch (error) {
    console.error('Error fetching flow detail:', error);
    return NextResponse.json({ error: 'Gagal memuat detail diagram alur.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    const { id } = await params;
    const flowId = parseInt(id, 10);
    if (isNaN(flowId) || flowId <= 0) {
      return NextResponse.json({ error: 'ID diagram tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);

    // 🔒 Authorization check: Only project Owner and Admin can update flows
    const editPerm = await assertCanEditFlow(sessionUserId, flowId);
    if (!editPerm.allowed) {
      return NextResponse.json(
        { error: editPerm.error || 'Akses ditolak. Hanya Owner dan Admin proyek yang dapat mengedit diagram ini.' },
        { status: editPerm.status }
      );
    }

    const body = await req.json();

    if (!validatePayloadSize(body)) {
      return NextResponse.json(
        { error: 'Ukuran diagram terlalu besar (maksimal 5MB).' },
        { status: 413 }
      );
    }

    const parsed = updateFlowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Input tidak valid.' },
        { status: 400 }
      );
    }

    const result = await FlowService.updateFlow(
      flowId,
      editPerm.projectId!,
      sessionUserId,
      parsed.data as any
    );

    if (result.status === 404) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    if (result.status === 409) {
      return NextResponse.json(
        { error: result.error, currentVersion: result.currentVersion },
        { status: 409 }
      );
    }

    return NextResponse.json({ flow: result.flow });
  } catch (error) {
    console.error('Error updating flow:', error);
    return NextResponse.json({ error: 'Gagal menyimpan diagram alur.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    const { id } = await params;
    const flowId = parseInt(id, 10);
    if (isNaN(flowId) || flowId <= 0) {
      return NextResponse.json({ error: 'ID diagram tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);

    // 🔒 Authorization check: Only project Owner and Admin can delete flows
    const editPerm = await assertCanEditFlow(sessionUserId, flowId);
    if (!editPerm.allowed) {
      return NextResponse.json(
        { error: editPerm.error || 'Akses ditolak. Hanya Owner dan Admin proyek yang dapat menghapus diagram ini.' },
        { status: editPerm.status }
      );
    }

    const result = await FlowService.deleteFlow(flowId, editPerm.projectId!, sessionUserId);
    if (result.status === 404) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Diagram berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting flow:', error);
    return NextResponse.json({ error: 'Gagal menghapus diagram alur.' }, { status: 500 });
  }
}
