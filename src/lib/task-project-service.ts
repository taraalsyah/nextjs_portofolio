import { prisma } from '@/lib/prisma';

export const DEFAULT_TASK_PROJECT_NAME = 'Tanpa Proyek';
export const DEFAULT_PHASE_NAME = 'Tanpa Phase';

/**
 * Gets or creates the default "Tanpa Proyek" task project for a specific workspace project.
 */
export async function getOrCreateDefaultTaskProject(projectId: number, db: any = prisma) {
  const client = db?.taskProject ? db : prisma;
  if (!client?.taskProject) {
    console.warn('Prisma client does not have taskProject model loaded yet');
    return null;
  }

  let taskProject = await client.taskProject.findFirst({
    where: {
      projectId,
      name: DEFAULT_TASK_PROJECT_NAME,
    },
  });

  if (!taskProject) {
    try {
      taskProject = await client.taskProject.create({
        data: {
          projectId,
          name: DEFAULT_TASK_PROJECT_NAME,
          description: 'Proyek default untuk tugas tanpa proyek khusus.',
        },
      });
    } catch {
      // Fallback in case of race condition / unique constraint
      taskProject = await client.taskProject.findFirst({
        where: {
          projectId,
          name: DEFAULT_TASK_PROJECT_NAME,
        },
      });
    }
  }

  return taskProject;
}

/**
 * Migrates all existing tasks with null taskProjectId or string phase.
 * Converts unique string phases on tasks into TaskPhase entities per TaskProject.
 * Idempotent and safe to run multiple times.
 */
export async function migrateTaskProjectsAndPhases() {
  try {
    const projects = await prisma.project.findMany({ select: { id: true } });

    for (const proj of projects) {
      const defaultTp = await getOrCreateDefaultTaskProject(proj.id);
      if (!defaultTp) continue;

      // 1. Update tasks with null taskProjectId
      await prisma.task.updateMany({
        where: {
          projectId: proj.id,
          taskProjectId: null,
        },
        data: {
          taskProjectId: defaultTp.id,
        },
      });

      // 2. Normalize null/empty phase strings to default
      await prisma.task.updateMany({
        where: {
          projectId: proj.id,
          OR: [
            { phase: null },
            { phase: '' },
          ],
        },
        data: {
          phase: DEFAULT_PHASE_NAME,
        },
      });
    }

    // 3. Migrate unique string phases into TaskPhase entities
    const taskProjects = await prisma.taskProject.findMany({
      select: { id: true, name: true },
    });

    for (const tp of taskProjects) {
      // Find all tasks for this taskProject with non-default phase
      const tasksWithPhase = await prisma.task.findMany({
        where: {
          taskProjectId: tp.id,
          phase: { not: DEFAULT_PHASE_NAME },
        },
        select: { id: true, phase: true, phaseId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const phaseNameSet = new Set<string>();
      tasksWithPhase.forEach((t) => {
        if (t.phase && t.phase.trim() && t.phase !== DEFAULT_PHASE_NAME) {
          phaseNameSet.add(t.phase.trim());
        }
      });

      let orderCounter = 0;
      for (const phaseName of Array.from(phaseNameSet)) {
        let taskPhase = await prisma.taskPhase.findFirst({
          where: {
            taskProjectId: tp.id,
            name: phaseName,
          },
        });

        if (!taskPhase) {
          try {
            taskPhase = await prisma.taskPhase.create({
              data: {
                taskProjectId: tp.id,
                name: phaseName,
                order: orderCounter++,
              },
            });
          } catch {
            taskPhase = await prisma.taskPhase.findFirst({
              where: {
                taskProjectId: tp.id,
                name: phaseName,
              },
            });
          }
        }

        if (taskPhase) {
          // Link tasks with this phase name to phaseId
          await prisma.task.updateMany({
            where: {
              taskProjectId: tp.id,
              phase: phaseName,
              phaseId: null,
            },
            data: {
              phaseId: taskPhase.id,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error during migrateTaskProjectsAndPhases:', error);
  }
}
