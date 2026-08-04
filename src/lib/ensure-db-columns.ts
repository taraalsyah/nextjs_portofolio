import { prisma } from '@/lib/prisma';

let isMigrated = false;

/**
 * Ensures that the required database columns for Done Request Approval Workflow
 * exist in the MySQL/TiDB database.
 */
export async function ensureDoneRequestColumns() {
  if (isMigrated) return;
  
  const queries = [
    "ALTER TABLE `tasks` ADD COLUMN `done_request_status` VARCHAR(191) NOT NULL DEFAULT 'NONE'",
    "ALTER TABLE `tasks` ADD COLUMN `done_requested_by_id` INT NULL",
    "ALTER TABLE `tasks` ADD COLUMN `done_requested_at` DATETIME(3) NULL",
    "ALTER TABLE `tasks` ADD COLUMN `done_request_note` TEXT NULL",
    "ALTER TABLE `tasks` ADD COLUMN `done_reviewed_by_id` INT NULL",
    "ALTER TABLE `tasks` ADD COLUMN `done_reviewed_at` DATETIME(3) NULL",
    "ALTER TABLE `tasks` ADD COLUMN `done_reject_reason` TEXT NULL",
  ];

  for (const sql of queries) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err: any) {
      // Ignore if column already exists or duplicate column error
      if (
        err?.message?.includes('Duplicate column') ||
        err?.message?.includes('already exists') ||
        err?.code === 'P2010'
      ) {
        // Expected if column already exists
      }
    }
  }

  isMigrated = true;
}
