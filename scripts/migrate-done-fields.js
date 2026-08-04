const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking & Migrating Done Request Columns ---');
  
  const columnsToAdd = [
    { name: 'done_request_status', sql: "ALTER TABLE `tasks` ADD COLUMN `done_request_status` VARCHAR(191) NOT NULL DEFAULT 'NONE'" },
    { name: 'done_requested_by_id', sql: "ALTER TABLE `tasks` ADD COLUMN `done_requested_by_id` INT NULL" },
    { name: 'done_requested_at', sql: "ALTER TABLE `tasks` ADD COLUMN `done_requested_at` DATETIME(3) NULL" },
    { name: 'done_request_note', sql: "ALTER TABLE `tasks` ADD COLUMN `done_request_note` TEXT NULL" },
    { name: 'done_reviewed_by_id', sql: "ALTER TABLE `tasks` ADD COLUMN `done_reviewed_by_id` INT NULL" },
    { name: 'done_reviewed_at', sql: "ALTER TABLE `tasks` ADD COLUMN `done_reviewed_at` DATETIME(3) NULL" },
    { name: 'done_reject_reason', sql: "ALTER TABLE `tasks` ADD COLUMN `done_reject_reason` TEXT NULL" },
  ];

  for (const col of columnsToAdd) {
    try {
      console.log(`Adding column ${col.name} if missing...`);
      await prisma.$executeRawUnsafe(col.sql);
      console.log(`Successfully added ${col.name}`);
    } catch (err) {
      if (err.message && (err.message.includes('Duplicate column') || err.message.includes('already exists'))) {
        console.log(`Column ${col.name} already exists.`);
      } else {
        console.log(`Notice for ${col.name}:`, err.message || err);
      }
    }
  }

  console.log('--- MIGRATION SCRIPT FINISHED ---');
}

main()
  .catch((err) => {
    console.error('Migration Error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
