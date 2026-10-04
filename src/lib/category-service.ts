import { prisma } from '@/lib/prisma';
import { invalidateCategoriesCache } from '@/lib/category-cache';

/**
 * Gets or creates the default "Uncategorized" category for a specific project (or global if projectId is null).
 */
export async function getOrCreateUncategorizedCategory(projectId: number | null | undefined, db: any = prisma) {
  const targetProjectId = projectId && projectId > 0 ? projectId : null;

  let category = await db.taskCategory.findFirst({
    where: {
      projectId: targetProjectId,
      name: 'Uncategorized',
    },
  });

  if (!category) {
    try {
      category = await db.taskCategory.create({
        data: {
          projectId: targetProjectId,
          name: 'Uncategorized',
          description: 'Kategori default untuk tugas yang belum dikategorikan.',
        },
      });
      if (targetProjectId) {
        await invalidateCategoriesCache(targetProjectId);
      }
    } catch {
      // Fallback in case of race conditions
      category = await db.taskCategory.findFirst({
        where: {
          projectId: targetProjectId,
          name: 'Uncategorized',
        },
      });
    }
  }

  return category;
}

/**
 * Migrates all existing tasks with null categoryId to "Uncategorized" for their respective project.
 * Idempotent and safe to run multiple times.
 */
export async function migrateUncategorizedTasks() {
  try {
    const projects = await prisma.project.findMany({ select: { id: true } });

    for (const proj of projects) {
      const uncategorizedCat = await getOrCreateUncategorizedCategory(proj.id);
      if (uncategorizedCat) {
        await prisma.task.updateMany({
          where: {
            projectId: proj.id,
            categoryId: null,
          },
          data: {
            categoryId: uncategorizedCat.id,
          },
        });
      }
    }

    const globalUncategorized = await getOrCreateUncategorizedCategory(null);
    if (globalUncategorized) {
      await prisma.task.updateMany({
        where: {
          projectId: null,
          categoryId: null,
        },
        data: {
          categoryId: globalUncategorized.id,
        },
      });
    }
  } catch (err) {
    console.error('Error running migrateUncategorizedTasks:', err);
  }
}
