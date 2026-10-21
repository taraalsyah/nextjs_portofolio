import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getActiveProjectContext } from '../src/lib/active-project';

let queryCount = 0;
const queries: string[] = [];

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
});

(prisma as any).$on('query', (e: any) => {
  queryCount++;
  queries.push(`${e.duration}ms | ${e.query.slice(0, 100)}...`);
});

async function measureTaskDetail() {
  console.log('====================================================');
  console.log('🔍 BENCHMARK DETAIL TASK MODAL: /api/tasks/[id]');
  console.log('====================================================\n');

  try {
    const task = await prisma.task.findFirst({
      where: { deletedAt: null },
      select: { id: true, projectId: true, title: true }
    });

    if (!task) {
      console.log('No task found in database.');
      return;
    }

    console.log(`Menguji Task: ID=${task.id}, Title="${task.title}"\n`);

    // Reset counter untuk pipeline detail
    queryCount = 0;
    queries.length = 0;

    const tStart = performance.now();

    // 1. Context Resolution
    const tCtx = performance.now();
    const user = await prisma.user.findFirst({ select: { id: true, name: true } });
    const activeProject = await getActiveProjectContext(user!.id, user!.name || undefined);
    const ctxDur = performance.now() - tCtx;

    // 2. Task FindFirst (Detail Query di src/app/api/tasks/[id]/route.ts)
    const tDetail = performance.now();
    const rawTask = await prisma.task.findFirst({
      where: { id: task.id, deletedAt: null },
      select: {
        id: true,
        taskNumber: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        createdById: true,
        categoryId: true,
        tags: true,
        startDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        closeRequestStatus: true,
        closeRequestedById: true,
        closeRequestedAt: true,
        closeRequestReason: true,
        closeReviewedById: true,
        closeReviewedAt: true,
        closeRejectReason: true,
        closeRequestedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        closeReviewedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        doneRequestStatus: true,
        doneRequestedById: true,
        doneRequestedAt: true,
        doneRequestNote: true,
        doneReviewedById: true,
        doneReviewedAt: true,
        doneRejectReason: true,
        doneRequestedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        doneReviewedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        assignee: { select: { id: true, name: true, username: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        category: { select: { id: true, name: true, description: true } },
        taskProjectId: true,
        phaseId: true,
        phase: true,
        phaseRel: { select: { id: true, name: true, order: true } },
        taskProject: { select: { id: true, name: true, description: true } },
        checklists: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            fileType: true,
            createdAt: true,
            uploadedById: true,
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        histories: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            fieldName: true,
            previousValue: true,
            newValue: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    const detailDur = performance.now() - tDetail;
    const totalDur = performance.now() - tStart;

    console.log(`⏱️ Waktu Eksekusi:`);
    console.log(`   - Context & Permissions : ${ctxDur.toFixed(2)} ms`);
    console.log(`   - findFirst Detail Task : ${detailDur.toFixed(2)} ms`);
    console.log(`   - Total Handler         : ${totalDur.toFixed(2)} ms`);
    console.log(`\n📊 Jumlah SQL Query yang Dijalankan: ${queryCount} query`);

    console.log('\n📝 Rincian Query SQL:');
    queries.forEach((q, idx) => console.log(`   ${idx + 1}. ${q}`));

    console.log('\n📦 Ukuran Data JSON Task Detail:');
    const jsonStr = JSON.stringify(rawTask);
    console.log(`   - Panjang String : ${jsonStr.length} karakter`);
    console.log(`   - Estimasi Ukuran: ${(Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(2)} KB`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

measureTaskDetail();
