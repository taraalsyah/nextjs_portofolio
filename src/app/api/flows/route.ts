import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveProjectContext } from '@/lib/active-project';
import { FlowService } from '@/services/flow/flow.service';
import { createFlowSchema, validatePayloadSize } from '@/lib/flow/validation';
import { assertCanCreateFlow } from '@/lib/flow/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

    const result = await FlowService.listFlows(activeProject.projectId, search, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar diagram alur.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 Authorization check: Only project Owner and Admin can create flows
    const perm = await assertCanCreateFlow(sessionUserId, activeProject.projectId);
    if (!perm.allowed) {
      return NextResponse.json(
        { error: perm.error || 'Akses ditolak. Hanya Owner dan Admin proyek yang dapat membuat diagram alur.' },
        { status: perm.status }
      );
    }

    const body = await req.json();

    if (!validatePayloadSize(body)) {
      return NextResponse.json(
        { error: 'Ukuran diagram terlalu besar (maksimal 5MB).' },
        { status: 413 }
      );
    }

    const parsed = createFlowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Input tidak valid.' },
        { status: 400 }
      );
    }

    const flow = await FlowService.createFlow(activeProject.projectId, sessionUserId, parsed.data as any);
    return NextResponse.json({ flow }, { status: 201 });
  } catch (error) {
    console.error('Error creating flow:', error);
    return NextResponse.json({ error: 'Gagal membuat diagram alur.' }, { status: 500 });
  }
}
