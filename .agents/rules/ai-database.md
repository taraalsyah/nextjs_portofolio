# AI Database & MCP Behavior Rules

## 1. Available MCP Tools Policy
- The AI Assistant MUST ONLY use MCP tools that are explicitly defined and exposed by the server.
- Supported tools: `get_task`, `search_tasks`, `get_project`, `get_project_tasks`, `search_projects`, `list_projects`, `count_project_tasks`, `count_assigned_tasks`, `get_overdue_tasks`.
- For project listing requests ("ada berapa project", "list project saya", "kasih daftar project", "project apa saja yang saya punya"), use `list_projects` to fetch ALL projects authorized for the user without keyword filtering.
- NEVER use `search_projects` with partial keywords (e.g. `search_projects({ keyword: "a" })`) when the user asks for a complete list or total count of their projects. `search_projects` is reserved ONLY for searching specific project names/keywords.
- NEVER use `search_tasks` to resolve a project name when the user refers to a project (e.g. "pada project X"). Use `search_projects` first.
- For count requests ("berapa", "jumlah", "total", "count"), use `count_project_tasks` after resolving the project ID to perform an exact database count.
- For tasks assigned to "saya", "aku", "my", or "ditugaskan ke saya", use `count_assigned_tasks` (for counts) or `get_project_tasks(assigned_to_me: true)` (for lists). NEVER search users by name to determine the current user identity. The user identity MUST come strictly from the server-side authenticated session (`session.user.id`).
- For overdue task requests ("overdue", "over due time", "lewat tenggat"), use `search_projects` -> `get_overdue_tasks` to fetch exact database overdue count and tasks (`dueDate < currentTimestamp AND status != 'DONE' AND deletedAt IS NULL`).
- NEVER invent MCP tools (e.g. `execute_sql`, `execute_readonly_sql`, `list_tables`).
- NEVER claim that SQL was executed when no SQL execution tool exists.

## 2. Server-Side Authentication & Authorization Security Boundary
- The identity of the user MUST ALWAYS come from the server-side authenticated session (`session.user.id`).
- NEVER trust a `userId`, `projectId`, or role provided directly by client payloads or prompt inputs.
- The AI system prompt is guidance only; the TRUE security boundary is enforced server-side by the MCP authorization layer.
- Access to project data MUST be verified against `Project.ownerUserId` or `ProjectMember.userId`.
- Knowing or providing a `project_id` does NOT guarantee authorization to read its contents.

## 3. Data Privacy & Leakage Prevention
- NEVER return data for projects where the user is neither an owner nor a member.
- NEVER reveal the existence, summary, or metadata of unauthorized projects to unauthorized users.
- If a requested project or task is unauthorized, return a clean authorization error message without leaking internal details.

## 4. Zero Hallucination & MCP Limits
- The AI MUST answer strictly using data returned by the authorized MCP tools.
- Do NOT fabricate task counts, task statuses, assignees, dates, or project details.
- Respect tool result limits (`search_tasks` max 20, `get_project_tasks` max 50).
- If tool results are truncated or limited by tool limits, state clearly to the user that the returned list reflects available results.
