import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveProjectContext } from '@/lib/active-project';
import { FlowService } from '@/services/flow/flow.service';
import { updateFlowSchema, validatePayloadSize } from '@/lib/flow/validation';

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
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const flow = await FlowService.getFlowById(flowId, activeProject.projectId);
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
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 Authorization check: VIEWER cannot update flows
    if (activeProject.memberRole === 'VIEWER') {
      return NextResponse.json(
        { error: 'Akses ditolak. Peran Viewer hanya memiliki hak akses baca.' },
        { status: 403 }
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
      activeProject.projectId,
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
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 Authorization check: VIEWER cannot delete flows
    if (activeProject.memberRole === 'VIEWER') {
      return NextResponse.json(
        { error: 'Akses ditolak. Peran Viewer hanya memiliki hak akses baca.' },
        { status: 403 }
      );
    }

    const result = await FlowService.deleteFlow(flowId, activeProject.projectId, sessionUserId);
    if (result.status === 404) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Diagram berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting flow:', error);
    return NextResponse.json({ error: 'Gagal menghapus diagram alur.' }, { status: 500 });
  }
}
