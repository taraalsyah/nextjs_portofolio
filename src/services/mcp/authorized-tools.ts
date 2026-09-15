import prisma from "@/lib/prisma";
import { getUserAuthorizedProjectIds, isUserAuthorizedForProject } from "./authorization";
import { executeGetTask, GetTaskInput } from "./tools/get-task";
import { executeSearchTasks, SearchTasksInput, parseAndSanitizeSearchInput } from "./tools/search-tasks";
import { executeGetProject, GetProjectInput } from "./tools/get-project";
import { executeGetProjectTasks, GetProjectTasksInput } from "./tools/get-project-tasks";
import { executeSearchProjects, SearchProjectsInput } from "./tools/search-projects";
import { executeCountProjectTasks, CountProjectTasksInput } from "./tools/count-project-tasks";
import { executeGetOverdueTasks, GetOverdueTasksInput } from "./tools/get-overdue-tasks";
import { executeListProjects, ListProjectsInput } from "./tools/list-projects";
import { executeCountAssignedTasks, CountAssignedTasksInput } from "./tools/count-assigned-tasks";
import { executeGetCurrentDatetime, GetCurrentDatetimeInput } from "./tools/get-current-datetime";
import { DatePreset, resolveDatePreset } from "./date-utils";
import { handleMcpError } from "./error-handler";

/**
 * Execute 'get_task' tool with server-side project authorization check.
 */
export async function executeGetTaskWithAuth(
  input: GetTaskInput,
  userId: number
): Promise<string> {
  const { task_id } = input;
  if (!task_id || typeof task_id !== "string" || task_id.trim() === "") {
    return "Error: Parameter task_id wajib diisi.";
  }

  const cleanTaskId = task_id.trim();
  const parsedId = parseInt(cleanTaskId, 10);
  const isNumeric = !isNaN(parsedId) && String(parsedId) === cleanTaskId;

  // 1. Locate task to determine project
  const taskRef = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { taskNumber: cleanTaskId },
        ...(isNumeric ? [{ id: parsedId }] : []),
      ],
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!taskRef || !taskRef.projectId) {
    return `Task dengan ID '${cleanTaskId}' tidak ditemukan atau tidak terasosiasi dengan project.`;
  }

  // 2. Verify authorization for the task's project
  const isAuthorized = await isUserAuthorizedForProject(userId, taskRef.projectId);
  if (!isAuthorized) {
    return `Error: Anda tidak memiliki akses ke data task pada project tersebut.`;
  }

  // 3. Delegate to tool executor
  return await executeGetTask(input);
}

/**
 * Execute 'search_tasks' tool with search scope strictly restricted to user's authorized projects.
 */
export async function executeSearchTasksWithAuth(
  input: SearchTasksInput,
  userId: number
): Promise<string> {
  const parsed = parseAndSanitizeSearchInput(input);

  const hasStructuredFilters =
    Boolean(parsed.cleanStatus) ||
    Boolean(parsed.cleanStatuses && parsed.cleanStatuses.length > 0) ||
    Boolean(parsed.cleanExcludeStatuses && parsed.cleanExcludeStatuses.length > 0) ||
    Boolean(parsed.cleanPriority) ||
    Boolean(parsed.projectId) ||
    parsed.assignedToMe ||
    parsed.overdue ||
    Boolean(parsed.datePreset) ||
    Boolean(parsed.dueDateFrom || parsed.dueDateTo) ||
    Boolean(parsed.createdFrom || parsed.createdTo) ||
    Boolean(parsed.updatedFrom || parsed.updatedTo) ||
    Boolean(parsed.completedFrom || parsed.completedTo);

  if (!parsed.primaryQuery && !hasStructuredFilters) {
    return JSON.stringify({
      success: false,
      errorCode: "INVALID_FILTER",
      message: "Parameter query, keyword, atau filter terstruktur (seperti status/excludeStatuses/priority/projectId/datePreset) wajib diisi.",
    });
  }

  // 1. Get user's authorized project IDs
  const authorizedProjectIds = await getUserAuthorizedProjectIds(userId);
  if (authorizedProjectIds.length === 0) {
    return JSON.stringify(
      {
        success: true,
        totalFound: 0,
        count: 0,
        limit: parsed.cappedLimit,
        offset: parsed.offset,
        hasMore: false,
        query: parsed.primaryQuery || null,
        tasks: [],
      },
      null,
      2
    );
  }

  // Target project scope: either user's specific requested project (if authorized) or all authorized projects
  const targetProjectIds = parsed.projectId
    ? (authorizedProjectIds.includes(parsed.projectId) ? [parsed.projectId] : [])
    : authorizedProjectIds;

  if (targetProjectIds.length === 0) {
    return JSON.stringify({
      success: false,
      errorCode: "FORBIDDEN",
      message: `Anda tidak memiliki akses ke project dengan ID '${parsed.projectId}'.`,
    });
  }

  const whereCondition: any = {
    deletedAt: null,
    projectId: { in: targetProjectIds },
  };

  if (parsed.assignedToMe) {
    whereCondition.assigneeId = userId;
  }

  if (parsed.cleanPriority) {
    whereCondition.priority = parsed.cleanPriority;
  }

  if (parsed.cleanStatus) {
    whereCondition.status = parsed.cleanStatus;
  } else if (parsed.cleanStatuses && parsed.cleanStatuses.length > 0) {
    whereCondition.status = { in: parsed.cleanStatuses };
  }

  if (parsed.cleanExcludeStatuses && parsed.cleanExcludeStatuses.length > 0) {
    whereCondition.status = { notIn: parsed.cleanExcludeStatuses };
  }

  if (parsed.overdue) {
    whereCondition.status = { notIn: ["DONE"] };
    whereCondition.dueDate = { lt: new Date() };
  }

  // Date filters
  if (parsed.dueDateFrom || parsed.dueDateTo) {
    whereCondition.dueDate = {
      ...(parsed.dueDateFrom ? { gte: new Date(parsed.dueDateFrom) } : {}),
      ...(parsed.dueDateTo ? { lt: new Date(parsed.dueDateTo) } : {}),
    };
  }
  if (parsed.createdFrom || parsed.createdTo) {
    whereCondition.createdAt = {
      ...(parsed.createdFrom ? { gte: new Date(parsed.createdFrom) } : {}),
      ...(parsed.createdTo ? { lt: new Date(parsed.createdTo) } : {}),
    };
  }
  if (parsed.updatedFrom || parsed.updatedTo) {
    whereCondition.updatedAt = {
      ...(parsed.updatedFrom ? { gte: new Date(parsed.updatedFrom) } : {}),
      ...(parsed.updatedTo ? { lt: new Date(parsed.updatedTo) } : {}),
    };
  }

  // Date Preset & Completion Range Handling in Asia/Jakarta
  if (parsed.datePreset || parsed.completedFrom || parsed.completedTo) {
    let start: Date | undefined;
    let end: Date | undefined;

    if (parsed.datePreset) {
      const bounds = resolveDatePreset(parsed.datePreset);
      start = bounds.start;
      end = bounds.end;
    } else {
      start = parsed.completedFrom ? new Date(parsed.completedFrom) : undefined;
      end = parsed.completedTo ? new Date(parsed.completedTo) : undefined;
    }

    const rangeCondition: any = {};
    if (start && !isNaN(start.getTime())) rangeCondition.gte = start;
    if (end && !isNaN(end.getTime())) rangeCondition.lt = end;

    whereCondition.AND = whereCondition.AND || [];
    whereCondition.AND.push({
      OR: [
        { doneReviewedAt: rangeCondition },
        {
          doneReviewedAt: null,
          updatedAt: rangeCondition,
        },
      ],
    });
  }

  if (parsed.termsToSearch.length > 0 && parsed.primaryQuery) {
    const searchConditions = parsed.termsToSearch.flatMap((term) => [
      { taskNumber: { contains: term } },
      { title: { contains: term } },
      { description: { contains: term } },
      { tags: { contains: term } },
    ]);
    whereCondition.OR = searchConditions;
  }

  // 2. Count total matches for pagination metadata
  const totalFound = await prisma.task.count({ where: whereCondition });

  // 3. Perform search restricted ONLY to authorized projects
  const tasks = await prisma.task.findMany({
    where: whereCondition,
    skip: parsed.offset,
    take: parsed.cappedLimit,
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
        },
      },
      assignee: {
        select: {
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (tasks.length === 0) {
    return JSON.stringify(
      {
        success: true,
        totalFound: 0,
        count: 0,
        limit: parsed.cappedLimit,
        offset: parsed.offset,
        hasMore: false,
        query: parsed.primaryQuery || null,
        tasks: [],
      },
      null,
      2
    );
  }

  // Quality ranking: Primary query matches first, then related terms matches
  if (parsed.primaryQuery) {
    const primaryLower = parsed.primaryQuery.toLowerCase();
    tasks.sort((a, b) => {
      const scoreA =
        (a.title && a.title.toLowerCase().includes(primaryLower)) ||
        (a.taskNumber && a.taskNumber.toLowerCase().includes(primaryLower))
          ? 2
          : (a.description && a.description.toLowerCase().includes(primaryLower)) ||
            (a.tags && a.tags.toLowerCase().includes(primaryLower))
          ? 1
          : 0;

      const scoreB =
        (b.title && b.title.toLowerCase().includes(primaryLower)) ||
        (b.taskNumber && b.taskNumber.toLowerCase().includes(primaryLower))
          ? 2
          : (b.description && b.description.toLowerCase().includes(primaryLower)) ||
            (b.tags && b.tags.toLowerCase().includes(primaryLower))
          ? 1
          : 0;

      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  const results = tasks.map((t) => ({
    id: t.id,
    taskNumber: t.taskNumber,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project: t.project ? t.project.projectName : null,
    category: t.category ? t.category.name : null,
    assignee: t.assignee ? t.assignee.name : "Unassigned",
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    doneReviewedAt: t.doneReviewedAt ? t.doneReviewedAt.toISOString() : null,
  }));

  const hasMore = parsed.offset + tasks.length < totalFound;

  return JSON.stringify(
    {
      totalFound,
      count: results.length,
      limit: parsed.cappedLimit,
      offset: parsed.offset,
      hasMore,
      query: parsed.primaryQuery || null,
      searchMode: parsed.primaryQuery ? parsed.mode : "structured",
      relatedTermsUsed: parsed.validRelatedTerms,
      tasks: results,
    },
    null,
    2
  );
}

/**
 * Execute 'get_project' tool with server-side authorization check.
 */
export async function executeGetProjectWithAuth(
  input: GetProjectInput,
  userId: number
): Promise<string> {
  const { project_id } = input;
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const isAuthorized = await isUserAuthorizedForProject(userId, parsedId);
  if (!isAuthorized) {
    return `Error: Anda tidak memiliki akses ke project dengan ID '${parsedId}'.`;
  }

  return await executeGetProject(input);
}

/**
 * Execute 'get_project_tasks' tool with server-side authorization check.
 */
export async function executeGetProjectTasksWithAuth(
  input: GetProjectTasksInput,
  userId: number
): Promise<string> {
  const { project_id } = input;
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const isAuthorized = await isUserAuthorizedForProject(userId, parsedId);
  if (!isAuthorized) {
    return `Error: Anda tidak memiliki akses ke project dengan ID '${parsedId}'.`;
  }

  return await executeGetProjectTasks(input, userId);
}

/**
 * Execute 'search_projects' tool with search scope strictly restricted to user's authorized projects.
 */
export async function executeSearchProjectsWithAuth(
  input: SearchProjectsInput,
  userId: number
): Promise<string> {
  const { keyword, limit = 10 } = input;
  if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
    return "Error: Parameter keyword wajib diisi.";
  }

  const cleanKeyword = keyword.trim();
  const cappedLimit = Math.min(Math.max(1, limit || 10), 20);

  // 1. Get user's authorized project IDs
  const authorizedProjectIds = await getUserAuthorizedProjectIds(userId);
  if (authorizedProjectIds.length === 0) {
    return `Tidak ditemukan project yang cocok dengan keyword '${cleanKeyword}' pada project yang dapat Anda akses.`;
  }

  // 2. Perform project search restricted ONLY to authorized projects
  const projects = await prisma.project.findMany({
    where: {
      id: { in: authorizedProjectIds },
      OR: [
        { projectName: { contains: cleanKeyword } },
        { description: { contains: cleanKeyword } },
      ],
    },
    take: cappedLimit,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          members: true,
          tasks: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (projects.length === 0) {
    return `Tidak ditemukan project yang cocok dengan keyword '${cleanKeyword}' pada project yang Anda akses.`;
  }

  const results = await Promise.all(
    projects.map(async (p) => {
      const activeTaskCount = await prisma.task.count({
        where: {
          projectId: p.id,
          deletedAt: null,
        },
      });

      return {
        id: p.id,
        projectName: p.projectName,
        description: p.description,
        visibility: p.visibility,
        owner: p.owner ? { id: p.owner.id, name: p.owner.name, email: p.owner.email } : null,
        totalMembers: p._count.members,
        totalTasks: activeTaskCount,
        updatedAt: p.updatedAt.toISOString(),
      };
    })
  );

  return JSON.stringify(
    {
      totalFound: projects.length,
      keyword: cleanKeyword,
      projects: results,
    },
    null,
    2
  );
}

/**
 * Execute 'count_project_tasks' tool with server-side authorization check.
 */
export async function executeCountProjectTasksWithAuth(
  input: CountProjectTasksInput,
  userId: number
): Promise<string> {
  const { project_id } = input;
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const isAuthorized = await isUserAuthorizedForProject(userId, parsedId);
  if (!isAuthorized) {
    return `Error: Anda tidak memiliki akses ke project dengan ID '${parsedId}'.`;
  }

  return await executeCountProjectTasks(input);
}

/**
 * Execute 'get_overdue_tasks' tool with server-side authorization check.
 */
export async function executeGetOverdueTasksWithAuth(
  input: GetOverdueTasksInput,
  userId: number
): Promise<string> {
  const { project_id } = input;
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const isAuthorized = await isUserAuthorizedForProject(userId, parsedId);
  if (!isAuthorized) {
    return `Error: Anda tidak memiliki akses ke project dengan ID '${parsedId}'.`;
  }

  return await executeGetOverdueTasks(input);
}

/**
 * Execute 'list_projects' tool returning ALL authorized projects for the current authenticated user.
 */
export async function executeListProjectsWithAuth(
  input: ListProjectsInput,
  userId: number
): Promise<string> {
  const { limit = 50 } = input || {};
  const cappedLimit = Math.min(Math.max(1, limit || 50), 100);

  // 1. Get user's authorized project IDs
  const authorizedProjectIds = await getUserAuthorizedProjectIds(userId);
  if (authorizedProjectIds.length === 0) {
    return JSON.stringify(
      {
        total: 0,
        limit: cappedLimit,
        projects: [],
      },
      null,
      2
    );
  }

  // 2. Fetch ALL authorized projects of current user
  const projects = await prisma.project.findMany({
    where: {
      id: { in: authorizedProjectIds },
    },
    take: cappedLimit,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const results = await Promise.all(
    projects.map(async (p) => {
      const activeTaskCount = await prisma.task.count({
        where: {
          projectId: p.id,
          deletedAt: null,
        },
      });

      return {
        id: p.id,
        projectName: p.projectName,
        description: p.description,
        visibility: p.visibility,
        owner: p.owner ? { id: p.owner.id, name: p.owner.name, email: p.owner.email } : null,
        totalMembers: p._count.members,
        totalTasks: activeTaskCount,
        updatedAt: p.updatedAt.toISOString(),
      };
    })
  );

  return JSON.stringify(
    {
      total: authorizedProjectIds.length,
      limit: cappedLimit,
      projects: results,
    },
    null,
    2
  );
}

/**
 * Execute 'count_assigned_tasks' tool with server-side authorization check and session user ID binding.
 */
export async function executeCountAssignedTasksWithAuth(
  input: CountAssignedTasksInput,
  userId: number
): Promise<string> {
  const { project_id } = input;
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const isAuthorized = await isUserAuthorizedForProject(userId, parsedId);
  if (!isAuthorized) {
    return `Error: Anda tidak memiliki akses ke project dengan ID '${parsedId}'.`;
  }

  return executeCountAssignedTasks(input, userId);
}

/**
 * Main dispatcher for authorized MCP tool calls.
 */
export async function handleAuthorizedToolCall(
  name: string,
  args: Record<string, any>,
  userId: number
): Promise<string> {
  try {
    switch (name) {
      case "get_task":
        return await executeGetTaskWithAuth(args as GetTaskInput, userId);
      case "search_tasks":
        return await executeSearchTasksWithAuth(args as SearchTasksInput, userId);
      case "get_project":
        return await executeGetProjectWithAuth(args as GetProjectInput, userId);
      case "get_project_tasks":
        return await executeGetProjectTasksWithAuth(args as GetProjectTasksInput, userId);
      case "search_projects":
        return await executeSearchProjectsWithAuth(args as SearchProjectsInput, userId);
      case "count_project_tasks":
        return await executeCountProjectTasksWithAuth(args as CountProjectTasksInput, userId);
      case "get_overdue_tasks":
        return await executeGetOverdueTasksWithAuth(args as GetOverdueTasksInput, userId);
      case "list_projects":
        return await executeListProjectsWithAuth(args as ListProjectsInput, userId);
      case "count_assigned_tasks":
        return await executeCountAssignedTasksWithAuth(args as CountAssignedTasksInput, userId);
      case "get_current_datetime":
        return await executeGetCurrentDatetime(args as GetCurrentDatetimeInput);
      default:
        return JSON.stringify({
          success: false,
          error: {
            code: "INVALID_TOOL",
            message: `Tool '${name}' tidak dikenali oleh MCP server.`,
          },
        });
    }
  } catch (error: any) {
    return handleMcpError(error, `MCP_TOOL_ERROR:${name}`);
  }
}
