import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function runBenchmark() {
  console.log('====================================================');
  console.log('🔍 BENCHMARK LATENCY APLIKASI -> CLOUD DATABASE');
  console.log('   Environment :', process.env.NODE_ENV || 'development');
  console.log('   Timestamp   :', new Date().toISOString());
  console.log('====================================================\n');

  try {
    // 1. Initial Connection & TLS Handshake
    console.log('⏳ Menginisialisasi koneksi awal (TCP + TLS Handshake)...');
    const tConnStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const connDuration = performance.now() - tConnStart;
    console.log(`✅ Handshake / Koneksi Pertama: ${connDuration.toFixed(2)} ms\n`);

    // 2. 20x SELECT 1 Consecutive Measurement
    console.log('⏳ Menjalankan 20x "SELECT 1" berurutan...');
    const samples: number[] = [];

    for (let i = 1; i <= 20; i++) {
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const dur = performance.now() - start;
      samples.push(dur);
      console.log(`   Query #${i.toString().padStart(2, '0')} : ${dur.toFixed(2)} ms`);
    }

    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const sum = samples.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / samples.length;

    console.log('\n====================================================');
    console.log('📊 HASIL PENGUKURAN LATENCY (ROUND TRIP TIME)');
    console.log('====================================================');
    console.log(`   Handshake Koneksi Awal : ${connDuration.toFixed(2)} ms`);
    console.log(`   Minimum RTT            : ${min.toFixed(2)} ms`);
    console.log(`   Rata-rata RTT (Avg)    : ${avg.toFixed(2)} ms`);
    console.log(`   Maksimum RTT           : ${max.toFixed(2)} ms`);
    console.log('----------------------------------------------------');

    // 3. Pengukuran Nyata: Seberapa Cepat Query Task Sebenarnya di DB Ini?
    console.log('\n⏳ Menguji Query Nyata Tabel Task di Cloud DB...');
    
    const tCountStart = performance.now();
    const taskCount = await prisma.task.count({ where: { deletedAt: null } });
    const countDur = performance.now() - tCountStart;
    console.log(`   COUNT(*) tasks (total ${taskCount} tasks) : ${countDur.toFixed(2)} ms`);

    const tFindStart = performance.now();
    const tasks = await prisma.task.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, priority: true }
    });
    const findDur = performance.now() - tFindStart;
    console.log(`   findMany tasks (take 10)           : ${findDur.toFixed(2)} ms`);

    // 4. Pengukuran Nyata Fungsi Migrasi di Hot Path
    console.log('\n⏳ Menguji Fungsi Migrasi di Hot Path GET /api/tasks...');
    const { migrateTaskProjectsAndPhases } = await import('../src/lib/task-project-service');
    const tMigrateStart = performance.now();
    await migrateTaskProjectsAndPhases();
    const migrateDur = performance.now() - tMigrateStart;
    console.log(`   migrateTaskProjectsAndPhases()     : ${migrateDur.toFixed(2)} ms`);

    const { ensureDoneRequestColumns } = await import('../src/lib/ensure-db-columns');
    const tEnsureStart = performance.now();
    await ensureDoneRequestColumns();
    const ensureDur = performance.now() - tEnsureStart;
    console.log(`   ensureDoneRequestColumns() (warm)  : ${ensureDur.toFixed(2)} ms`);

    // 4. Simulasi Akumulasi Query pada Halaman Task Management
    const warmQueries = 40;
    const coldQueries = 60;
    console.log('\n====================================================');
    console.log('💡 SIMULASI AKUMULASI LATENCY PADA TASK MANAGEMENT');
    console.log('====================================================');
    console.log(`1. Dari Lokasi Eksekusi Saat Ini (Avg RTT = ${avg.toFixed(2)} ms):`);
    console.log(`   - Warm Load (±${warmQueries} queries)       : ${((avg * warmQueries) / 1000).toFixed(2)} detik`);
    console.log(`   - Cold Start (±${coldQueries} queries)      : ${((avg * coldQueries + connDuration) / 1000).toFixed(2)} detik`);

    console.log(`\n2. Jika Server Prod Berbeda Region / Benua (Asumsi RTT Cross-Region ±220 ms):`);
    console.log(`   - Warm Load (±${warmQueries} queries)       : ${((220 * warmQueries) / 1000).toFixed(2)} detik`);
    console.log(`   - Cold Start (±${coldQueries} queries)      : ${((220 * coldQueries + 600) / 1000).toFixed(2)} detik`);

    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat benchmark:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runBenchmark();
