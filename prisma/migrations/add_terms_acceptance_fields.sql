-- Migration: Add accepted_terms_at and accepted_terms_version to users table
ALTER TABLE `users`
  ADD COLUMN `accepted_terms_at` DATETIME(3) NULL,
  ADD COLUMN `accepted_terms_version` VARCHAR(191) NULL;
