import { prisma } from '@/lib/prisma';
import { FlowData, AppNode } from '@/types/flow';
import { getTemplateById } from '@/lib/flow/templates';
import { ensureFlowTable } from '@/lib/flow/ensure-flow-table';

function getPrisma(): typeof prisma {
  return prisma;
}

export interface CreateFlowInput {
  name: string;
  description?: string | null;
  templateId?: string;
  data?: FlowData;
}

export interface UpdateFlowInput {
  name?: string;
  description?: string | null;
  data: FlowData;
  version: number;
  thumbnail?: string | null;
}

export class FlowService {
  /**
   * List flows with search and pagination
   */
  static async listFlows(
    projectId: number,
    search: string = '',
    page: number = 1,
    limit: number = 12
  ) {
    await ensureFlowTable();
    const db = getPrisma();

    const skip = (page - 1) * limit;
    const where: any = {
      projectId,
      deletedAt: null,
    };

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const [total, flows] = await Promise.all([
      db.flow.count({ where }),
      db.flow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          projectId: true,
          name: true,
          description: true,
          version: true,
          thumbnail: true,
          createdById: true,
          updatedById: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: { id: true, name: true, email: true, image: true },
          },
          updatedBy: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
    ]);

    return {
      flows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Get detail flow with task enrichment
   */
  static async getFlowById(flowId: number, projectId: number) {
    await ensureFlowTable();
    const db = getPrisma();

    const flow = await db.flow.findFirst({
      where: {
        id: flowId,
        projectId,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!flow) return null;

    let flowData = flow.data as unknown as FlowData;
    if (!flowData || typeof flowData !== 'object') {
      flowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };
    }

    // 🔒 Real-time Task Enrichment: Retrieve fresh task states from DB
    const taskIds = new Set<number>();
    (flowData.nodes || []).forEach((node: AppNode) => {
      const taskId = node.data?.taskId;
      if (typeof taskId === 'number' && taskId > 0) {
        taskIds.add(taskId);
      }
    });

    if (taskIds.size > 0) {
      const tasks = await db.task.findMany({
        where: {
          id: { in: Array.from(taskIds) },
          projectId,
          deletedAt: null,
        },
        include: {
          assignee: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      const taskMap = new Map<number, (typeof tasks)[number]>();
      tasks.forEach((t: (typeof tasks)[number]) => taskMap.set(t.id, t));

      flowData.nodes = flowData.nodes.map((node: AppNode) => {
        const taskId = node.data?.taskId;
        if (typeof taskId === 'number' && taskId > 0) {
          const task = taskMap.get(taskId);
          if (task) {
            return {
              ...node,
              data: {
                ...node.data,
                taskNumber: task.taskNumber,
                taskTitle: task.title,
                taskStatus: task.status,
                taskPriority: task.priority,
                assigneeName: task.assignee?.name || null,
                assigneeImage: task.assignee?.image || null,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                isNotFound: false,
              },
            };
          } else {
            return {
              ...node,
              data: {
                ...node.data,
                isNotFound: true,
              },
            };
          }
        }
        return node;
      });
    }

    return {
      ...flow,
      data: flowData,
    };
  }

  /**
   * Create a new flow
   */
  static async createFlow(
    projectId: number,
    userId: number,
    input: CreateFlowInput
  ) {
    await ensureFlowTable();
    const db = getPrisma();

    let initialData = input.data;
    if (!initialData && input.templateId) {
      const template = getTemplateById(input.templateId);
      initialData = template.data;
    }

    if (!initialData) {
      const template = getTemplateById('blank');
      initialData = template.data;
    }

    const flow = await db.flow.create({
      data: {
        projectId,
        name: input.name,
        description: input.description || null,
        data: initialData as any,
        version: 1,
        createdById: userId,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return flow;
  }

  /**
   * Update flow with optimistic concurrency check
   */
  static async updateFlow(
    flowId: number,
    projectId: number,
    userId: number,
    input: UpdateFlowInput
  ) {
    await ensureFlowTable();
    const db = getPrisma();

    const existing = await db.flow.findFirst({
      where: {
        id: flowId,
        projectId,
        deletedAt: null,
      },
      select: { id: true, version: true },
    });

    if (!existing) {
      return { status: 404, error: 'Diagram tidak ditemukan.' };
    }

    // 🔒 Optimistic Concurrency Control
    if (existing.version !== input.version) {
      return {
        status: 409,
        error: 'Diagram telah diperbarui oleh sesi lain. Harap muat ulang diagram untuk mendapatkan versi terbaru.',
        currentVersion: existing.version,
      };
    }

    const updated = await db.flow.update({
      where: { id: flowId },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        description: input.description !== undefined ? input.description : undefined,
        data: input.data as any,
        thumbnail: input.thumbnail !== undefined ? input.thumbnail : undefined,
        version: existing.version + 1,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return { status: 200, flow: updated };
  }

  /**
   * Soft delete flow
   */
  static async deleteFlow(flowId: number, projectId: number, userId: number) {
    await ensureFlowTable();
    const db = getPrisma();

    const existing = await db.flow.findFirst({
      where: {
        id: flowId,
        projectId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return { status: 404, error: 'Diagram tidak ditemukan.' };
    }

    await db.flow.update({
      where: { id: flowId },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });

    return { status: 200, success: true };
  }

  /**
   * Duplicate flow
   */
  static async duplicateFlow(flowId: number, projectId: number, userId: number) {
    await ensureFlowTable();
    const db = getPrisma();

    const existing = await db.flow.findFirst({
      where: {
        id: flowId,
        projectId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return { status: 404, error: 'Diagram sumber tidak ditemukan.' };
    }

    const duplicated = await db.flow.create({
      data: {
        projectId,
        name: `${existing.name} (Salinan)`,
        description: existing.description,
        data: existing.data as any,
        thumbnail: existing.thumbnail,
        version: 1,
        createdById: userId,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return { status: 201, flow: duplicated };
  }
}
