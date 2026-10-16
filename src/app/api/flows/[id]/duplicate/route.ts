import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveProjectContext } from '@/lib/active-project';
import { FlowService } from '@/services/flow/flow.service';

export async function POST(
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

    // 🔒 Authorization check: VIEWER cannot duplicate/create flows
    if (activeProject.memberRole === 'VIEWER') {
      return NextResponse.json(
        { error: 'Akses ditolak. Peran Viewer hanya memiliki hak akses baca.' },
        { status: 403 }
      );
    }

    const result = await FlowService.duplicateFlow(flowId, activeProject.projectId, sessionUserId);
    if (result.status === 404) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ flow: result.flow }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating flow:', error);
    return NextResponse.json({ error: 'Gagal menduplikasi diagram alur.' }, { status: 500 });
  }
}
