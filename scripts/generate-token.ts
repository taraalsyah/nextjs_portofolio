import { prisma } from '../src/lib/prisma';
import { generateUserApiToken } from '../src/services/user/api-token.service';

async function main() {
  const userIdArg = process.argv[2] || '1';
  const userId = parseInt(userIdArg, 10);

  if (isNaN(userId)) {
    console.error('❌ User ID harus berupa angka. Contoh: npx tsx scripts/generate-token.ts 1');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user) {
    console.error(`❌ User dengan ID ${userId} tidak ditemukan.`);
    process.exit(1);
  }

  const rawToken = await generateUserApiToken(userId, 'CLI', 'Terminal Script');

  console.log('\n======================================================');
  console.log('✅ Personal API Token Berhasil Di-generate!');
  console.log('======================================================');
  console.log(`👤 User     : ${user.name} (${user.email})`);
  console.log(`🔑 Role     : ${user.role}`);
  console.log(`📌 Status   : ${user.status}`);
  console.log(`🔑 API Token: ${rawToken}`);
  console.log('======================================================\n');
  console.log('🚀 Coba tes GET /api/users di Terminal Anda dengan cURL berikut:\n');
  console.log(`curl -X GET "http://localhost:3000/api/users?page=1&pageSize=10" \\`);
  console.log(`  -H "Authorization: Bearer ${rawToken}"\n`);
  console.log('======================================================\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error generating token:', err);
  process.exit(1);
});
