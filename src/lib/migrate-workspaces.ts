import { prisma } from './prisma';
import { ensurePersonalWorkspace, migrateTasksToPersonalWorkspace } from './project';

async function runMigration() {
  console.log('--- Starting Workspace & Task Migration ---');
  
  // 1. Ensure Personal Workspace for all existing users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  console.log(`Found ${users.length} users. Ensuring personal workspaces...`);
  for (const user of users) {
    const ws = await ensurePersonalWorkspace(user.id, user.name);
    console.log(`User ${user.email} -> Personal Workspace ID: ${ws.id}`);
  }

  // 2. Migrate tasks with null projectId
  console.log('Migrating orphaned tasks to personal workspaces...');
  await migrateTasksToPersonalWorkspace();
  console.log('--- Migration Completed Successfully ---');
}

runMigration()
  .catch((err) => {
    console.error('Migration failed:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
