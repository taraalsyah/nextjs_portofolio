import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('[Migration] Starting TaskCategory to Project-Scoped migration...');

  // 1. Fetch all existing categories
  const categories = await prisma.taskCategory.findMany({
    include: {
      tasks: {
        select: {
          id: true,
          projectId: true,
        },
      },
    },
  });

  console.log(`[Migration] Found ${categories.length} total categories.`);

  // 2. Fetch first available project as fallback for unassigned categories
  const firstProject = await prisma.project.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, projectName: true },
  });

  const fallbackProjectId = firstProject?.id || null;

  for (const cat of categories) {
    if (cat.projectId != null) {
      console.log(`[Migration] Category ID ${cat.id} (${cat.name}) already has projectId ${cat.projectId}. Skipping.`);
      continue;
    }

    // Group tasks using this category by projectId
    const tasksWithProject = cat.tasks.filter((t) => t.projectId !== null);
    const projectMap = new Map<number, number[]>(); // projectId -> array of taskIds

    for (const t of tasksWithProject) {
      if (t.projectId) {
        const list = projectMap.get(t.projectId) || [];
        list.push(t.id);
        projectMap.set(t.projectId, list);
      }
    }

    const projectIds = Array.from(projectMap.keys());

    if (projectIds.length === 0) {
      // Category not used by any task: assign to fallback project
      if (fallbackProjectId) {
        await prisma.taskCategory.update({
          where: { id: cat.id },
          data: { projectId: fallbackProjectId },
        });
        console.log(`[Migration] Unused Category ID ${cat.id} (${cat.name}) assigned to Fallback Project ID ${fallbackProjectId}.`);
      } else {
        console.log(`[Migration] Unused Category ID ${cat.id} (${cat.name}) remains unassigned (no projects exist yet).`);
      }
    } else if (projectIds.length === 1) {
      // All tasks belong to single project: update category.projectId directly
      const pId = projectIds[0];
      await prisma.taskCategory.update({
        where: { id: cat.id },
        data: { projectId: pId },
      });
      console.log(`[Migration] Category ID ${cat.id} (${cat.name}) assigned to Project ID ${pId}.`);
    } else {
      // Category used across multiple projects: assign first project to original category, create new category copies for other projects
      const [firstPId, ...otherPIds] = projectIds;

      await prisma.taskCategory.update({
        where: { id: cat.id },
        data: { projectId: firstPId },
      });
      console.log(`[Migration] Category ID ${cat.id} (${cat.name}) assigned to Project ID ${firstPId}.`);

      for (const pId of otherPIds) {
        const taskIdsToUpdate = projectMap.get(pId) || [];
        // Create duplicate category for project pId
        const newCat = await prisma.taskCategory.create({
          data: {
            name: cat.name,
            description: cat.description,
            projectId: pId,
          },
        });

        // Re-link tasks to new category
        await prisma.task.updateMany({
          where: { id: { in: taskIdsToUpdate } },
          data: { categoryId: newCat.id },
        });

        console.log(`[Migration] Created new Category ID ${newCat.id} (${cat.name}) for Project ID ${pId} and updated ${taskIdsToUpdate.length} tasks.`);
      }
    }
  }

  console.log('[Migration] Category migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Migration] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
