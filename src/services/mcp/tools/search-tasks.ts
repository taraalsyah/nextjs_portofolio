import prisma from "@/lib/prisma";
import { DatePreset, resolveDatePreset } from "../date-utils";

export interface SearchTasksInput {
  query?: string;
  keyword?: string;
  relatedTerms?: string[];
  searchMode?: "keyword" | "expanded";
  limit?: number;
  offset?: number;
  status?: string;
  statuses?: string[];
  excludeStatuses?: string[];
  projectId?: number;
  priority?: string;
  assigned_to_me?: boolean;
  overdue?: boolean;
  datePreset?: DatePreset;
  dueDateFrom?: string;
  dueDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  completedFrom?: string;
  completedTo?: string;
}

export function parseAndSanitizeSearchInput(input: SearchTasksInput) {
  const primaryQuery = (input.query || input.keyword || "").trim();
  const rawLimit = input.limit;
  const cappedLimit = Math.min(Math.max(1, typeof rawLimit === "number" ? rawLimit : 10), 20);
  const rawOffset = input.offset;
  const offset = Math.max(0, typeof rawOffset === "number" ? rawOffset : 0);

  let mode: "keyword" | "expanded" =
    input.searchMode === "expanded" ? "expanded" : "keyword";

  const validRelatedTerms: string[] = [];
  if (Array.isArray(input.relatedTerms) && input.relatedTerms.length > 0) {
    const seen = new Set<string>([primaryQuery.toLowerCase()]);
    for (const term of input.relatedTerms) {
      if (typeof term === "string") {
        const clean = term.trim();
        if (clean && clean.length <= 100 && !seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          validRelatedTerms.push(clean);
          if (validRelatedTerms.length >= 15) break;
        }
      }
    }
  }

  if (validRelatedTerms.length > 0 && input.searchMode !== "keyword") {
    mode = "expanded";
  }

  const termsToSearch =
    mode === "expanded" && validRelatedTerms.length > 0
      ? [primaryQuery, ...validRelatedTerms]
      : [primaryQuery];

  const cleanStatus =
    input.status && typeof input.status === "string"
      ? input.status.trim().toUpperCase()
      : undefined;

  const cleanStatuses = Array.isArray(input.statuses)
    ? input.statuses
        .filter((s): s is string => typeof s === "string" && s.trim() !== "")
        .map((s) => s.trim().toUpperCase())
    : undefined;

  const cleanExcludeStatuses = Array.isArray(input.excludeStatuses)
    ? input.excludeStatuses
        .filter((s): s is string => typeof s === "string" && s.trim() !== "")
        .map((s) => s.trim().toUpperCase())
    : undefined;

  const cleanPriority =
    input.priority && typeof input.priority === "string"
      ? input.priority.trim().toUpperCase()
      : undefined;

  const projectId =
    typeof input.projectId === "number" && !isNaN(input.projectId)
      ? input.projectId
      : undefined;

  return {
    primaryQuery,
    mode,
    validRelatedTerms: mode === "expanded" ? validRelatedTerms : [],
    termsToSearch: termsToSearch.filter(Boolean),
    cappedLimit,
    offset,
    cleanStatus,
    cleanStatuses,
    cleanExcludeStatuses,
    cleanPriority,
    projectId,
    assignedToMe: Boolean(input.assigned_to_me),
    overdue: Boolean(input.overdue),
    datePreset: input.datePreset,
    dueDateFrom: input.dueDateFrom,
    dueDateTo: input.dueDateTo,
    createdFrom: input.createdFrom,
    createdTo: input.createdTo,
    updatedFrom: input.updatedFrom,
    updatedTo: input.updatedTo,
    completedFrom: input.completedFrom,
    completedTo: input.completedTo,
  };
}

export async function executeSearchTasks(input: SearchTasksInput) {
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

  const whereCondition: any = {
    deletedAt: null,
  };

  if (parsed.projectId) {
    whereCondition.projectId = parsed.projectId;
  }

  if (parsed.cleanPriority) {
    whereCondition.priority = parsed.cleanPriority;
  }

  if (parsed.cleanStatus) {
    whereCondition.status = parsed.cleanStatus;
  } else if (parsed.cleanStatuses && parsed.cleanStatuses.length > 0) {
    whereCondition.status = { in: parsed.cleanStatuses };
  } else if (parsed.cleanExcludeStatuses && parsed.cleanExcludeStatuses.length > 0) {
    whereCondition.status = { notIn: parsed.cleanExcludeStatuses };
  } else if (parsed.overdue) {
    whereCondition.status = { notIn: ["DONE"] };
  }

  if (parsed.overdue) {
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

  const totalFound = await prisma.task.count({ where: whereCondition });

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
      success: true,
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
