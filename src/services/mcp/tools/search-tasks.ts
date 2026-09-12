import prisma from "@/lib/prisma";

export interface SearchTasksInput {
  query?: string;
  keyword?: string;
  relatedTerms?: string[];
  searchMode?: "keyword" | "expanded";
  limit?: number;
  status?: string;
}

export function parseAndSanitizeSearchInput(input: SearchTasksInput) {
  const primaryQuery = (input.query || input.keyword || "").trim();
  const rawLimit = input.limit;
  const cappedLimit = Math.min(Math.max(1, rawLimit || 20), 50);

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

  return {
    primaryQuery,
    mode,
    validRelatedTerms: mode === "expanded" ? validRelatedTerms : [],
    termsToSearch: termsToSearch.filter(Boolean),
    cappedLimit,
    cleanStatus,
  };
}

export async function executeSearchTasks(input: SearchTasksInput) {
  const parsed = parseAndSanitizeSearchInput(input);
  if (!parsed.primaryQuery) {
    return "Error: Parameter query atau keyword wajib diisi.";
  }

  const searchConditions = parsed.termsToSearch.flatMap((term) => [
    { taskNumber: { contains: term } },
    { title: { contains: term } },
    { description: { contains: term } },
    { tags: { contains: term } },
  ]);

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      ...(parsed.cleanStatus ? { status: parsed.cleanStatus } : {}),
      OR: searchConditions,
    },
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
    return `Tidak ditemukan task yang cocok dengan query '${parsed.primaryQuery}'.`;
  }

  // Quality ranking: Primary query matches first, then related terms matches
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

  return JSON.stringify(
    {
      totalFound: tasks.length,
      query: parsed.primaryQuery,
      searchMode: parsed.mode,
      relatedTermsUsed: parsed.validRelatedTerms,
      limit: parsed.cappedLimit,
      tasks: results,
    },
    null,
    2
  );
}
