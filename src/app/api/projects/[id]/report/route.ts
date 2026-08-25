import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getProjectReportData,
  generateExcelReport,
  generatePdfReport,
  ProjectReportFilterParams,
} from '@/services/report/project-report.service';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired. Silakan login kembali.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as { id?: string | number }).id || '0'), 10);
    const { id } = await context.params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    // Verify Project Existence & User Access Permission
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, ownerUserId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    // Check project membership (Owner, Admin, Member, or Viewer)
    const isOwner = project.ownerUserId === sessionUserId;
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: sessionUserId,
        },
      },
    });

    const isSystemAdmin = (session.user as { role?: string }).role === 'Admin';

    if (!isOwner && !membership && !isSystemAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk melihat laporan proyek ini.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format')?.toLowerCase() || 'pdf';

    // Extract dynamic filter parameters from request URL
    const filters: ProjectReportFilterParams = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      createdById: searchParams.get('createdById') || undefined,
      dueDate: searchParams.get('dueDate') || undefined,
    };

    // Execute read-only report data retrieval with active database filters
    const reportData = await getProjectReportData(projectId, filters);

    // Clean project name for file download filename
    const safeProjectName = reportData.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];

    if (format === 'excel' || format === 'xlsx') {
      const excelBuffer = await generateExcelReport(reportData);
      const filename = `Project_${safeProjectName}_Report_${dateStamp}.xlsx`;

      return new NextResponse(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } else {
      // Default to PDF format
      const pdfBuffer = await generatePdfReport(reportData);
      const filename = `Project_${safeProjectName}_Report_${dateStamp}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('GET /api/projects/[id]/report error:', err);

    // If dataset size limit is exceeded or validation error occurs, return 400 Bad Request
    if (errorMsg.includes('Too many tasks match') || errorMsg.includes('limit')) {
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
