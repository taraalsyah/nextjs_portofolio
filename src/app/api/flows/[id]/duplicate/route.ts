import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveProjectContext } from '@/lib/active-project';
import { FlowService } from '@/services/flow/flow.service';
import { assertCanEditFlow } from '@/lib/flow/permissions';

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

    // 🔒 Authorization check: Only project Owner and Admin can duplicate/create flows
    const editPerm = await assertCanEditFlow(sessionUserId, flowId);
    if (!editPerm.allowed) {
      return NextResponse.json(
        { error: editPerm.error || 'Akses ditolak. Hanya Owner dan Admin proyek yang dapat menduplikasi diagram ini.' },
        { status: editPerm.status }
      );
    }

    const result = await FlowService.duplicateFlow(flowId, editPerm.projectId!, sessionUserId);
    if (result.status === 404) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ flow: result.flow }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating flow:', error);
    return NextResponse.json({ error: 'Gagal menduplikasi diagram alur.' }, { status: 500 });
  }
}
