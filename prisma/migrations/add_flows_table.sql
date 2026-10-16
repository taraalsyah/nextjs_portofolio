-- CreateTable for Flow diagram editor
CREATE TABLE IF NOT EXISTS `flows` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `project_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `data` JSON NOT NULL,
    `version` INT NOT NULL DEFAULT 1,
    `thumbnail` LONGTEXT NULL,
    `created_by_id` INT NOT NULL,
    `updated_by_id` INT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `flows_project_id_idx`(`project_id`),
    INDEX `flows_deleted_at_idx`(`deleted_at`),
    INDEX `flows_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `flows_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `flows_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `flows_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
