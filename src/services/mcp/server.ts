import { z } from "zod";
import { executeGetTask } from "./tools/get-task";
import { executeSearchTasks } from "./tools/search-tasks";
import { executeGetProject } from "./tools/get-project";
import { executeGetProjectTasks } from "./tools/get-project-tasks";
import { executeSearchProjects } from "./tools/search-projects";
import { executeCountProjectTasks } from "./tools/count-project-tasks";
import { executeGetOverdueTasks } from "./tools/get-overdue-tasks";
import { executeListProjects } from "./tools/list-projects";
import { executeCountAssignedTasks } from "./tools/count-assigned-tasks";

export class SimpleMcpServer {
  name: string;
  version: string;
  tools: Map<string, any> = new Map();

  constructor(opts: { name: string; version: string }) {
    this.name = opts.name;
    this.version = opts.version;
  }

  tool(name: string, description: string, schema: any, handler: Function) {
    this.tools.set(name, { description, schema, handler });
  }
}

export function createMcpServer() {
  try {
    // Try requiring official SDK if installed
    const dynamicRequire = eval("require");
    const { McpServer } = dynamicRequire("@modelcontextprotocol/sdk/server/mcp.js");
    const server = new McpServer({
      name: "tasktuntas-mcp",
      version: "1.0.0",
    });

    server.tool(
      "get_task",
      "Mengambil informasi detail task berdasarkan task ID atau taskNumber (contoh: 'A-1234' atau '12')",
      {
        task_id: z.string().describe("ID task atau taskNumber (contoh: 'A-1234' atau '12')"),
      },
      async ({ task_id }: { task_id: string }) => {
        const text = await executeGetTask({ task_id });
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "search_tasks",
      "Mencari task menggunakan pencarian kata kunci (keyword) atau pencarian konsep yang diperluas (expanded search) dengan relatedTerms",
      {
        query: z.string().optional().describe("Konsep atau kata kunci pencarian utama"),
        keyword: z.string().optional().describe("Kata kunci pencarian opsional (backwards compatibility)"),
        relatedTerms: z.array(z.string()).optional().describe("Daftar kata kunci terkait, sinonim, istilah bahasa Indonesia/Inggris, atau singkatan untuk pencarian mode 'expanded' (maksimal 15 istilah)"),
        searchMode: z.enum(["keyword", "expanded"]).optional().describe("Mode pencarian: 'keyword' untuk pencarian kata/judul/kode task persis; 'expanded' untuk pencarian konsep berbasis topik/sinonim"),
        limit: z.number().optional().describe("Jumlah maksimal hasil yang dikembalikan (default: 20, max: 50)"),
      },
      async (args: any) => {
        const text = await executeSearchTasks(args);
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "get_project",
      "Mengambil informasi detail project berdasarkan project ID (numeric ID)",
      {
        project_id: z.union([z.number(), z.string()]).describe("ID numerik dari project"),
      },
      async ({ project_id }: { project_id: string | number }) => {
        const text = await executeGetProject({ project_id });
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "get_project_tasks",
      "Mengambil daftar task dalam sebuah project berdasarkan project ID dengan filter status opsional",
      {
        project_id: z.union([z.number(), z.string()]).describe("ID numerik dari project"),
        status: z.string().optional().describe("Filter status task (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')"),
        limit: z.number().optional().describe("Jumlah maksimal hasil (default: 20, max: 50)"),
      },
      async ({ project_id, status, limit }: { project_id: string | number; status?: string; limit?: number }) => {
        const text = await executeGetProjectTasks({ project_id, status, limit });
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "search_projects",
      "Mencari project berdasarkan nama atau keyword project",
      {
        keyword: z.string().describe("Nama atau keyword project"),
        limit: z.number().optional().describe("Jumlah maksimal hasil (default: 10, max: 20)"),
      },
      async ({ keyword, limit }: { keyword: string; limit?: number }) => {
        const text = await executeSearchProjects({ keyword, limit });
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "count_project_tasks",
      "Menghitung jumlah total task dalam sebuah project berdasarkan project ID dengan filter status opsional",
      {
        project_id: z.union([z.number(), z.string()]).describe("ID numerik dari project"),
        status: z.string().optional().describe("Filter status task (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')"),
      },
      async ({ project_id, status }: { project_id: string | number; status?: string }) => {
        const text = await executeCountProjectTasks({ project_id, status });
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "get_overdue_tasks",
      "Mengambil daftar task yang overdue (due date telah lewat dan status belum DONE) dalam sebuah project berdasarkan project ID",
      {
        project_id: z.union([z.number(), z.string()]).describe("ID numerik dari project"),
        limit: z.number().optional().describe("Jumlah maksimal hasil (default: 50, max: 100)"),
      },
      async ({ project_id, limit }: { project_id: string | number; limit?: number }) => {
        const text = await executeGetOverdueTasks({ project_id, limit });
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "list_projects",
      "Mengambil seluruh daftar project yang dapat diakses (authorized) oleh user yang sedang login",
      {
        limit: z.number().optional().describe("Jumlah maksimal hasil (default: 50, max: 100)"),
      },
      async ({ limit }: { limit?: number }) => {
        const text = await executeListProjects({ limit });
        return { content: [{ type: "text", text }] };
      }
    );

    server.tool(
      "count_assigned_tasks",
      "Menghitung jumlah total task dalam sebuah project yang ditugaskan kepada SAYA (user yang sedang login)",
      {
        project_id: z.union([z.number(), z.string()]).describe("ID numerik dari project"),
        status: z.string().optional().describe("Filter status task opsional (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')"),
      },
      async ({ project_id, status }: { project_id: string | number; status?: string }) => {
        // Fallback placeholder call (authorized direct tool calls are routed via handleAuthorizedToolCall)
        const text = await executeCountAssignedTasks({ project_id, status }, 0);
        return { content: [{ type: "text", text }] };
      }
    );

    return server;
  } catch (err) {
    // Safe fallback instance
    return new SimpleMcpServer({
      name: "tasktuntas-mcp",
      version: "1.0.0",
    });
  }
}

export const MCP_TOOLS_LIST = [
  {
    name: "get_task",
    description: "Mengambil informasi detail task berdasarkan task ID atau taskNumber (contoh: 'A-1234' atau '12')",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID task atau taskNumber (contoh: 'A-1234' atau '12')",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "search_tasks",
    description: "Mencari task menggunakan pencarian kata kunci (keyword) atau pencarian konsep topik yang diperluas (expanded search). Gunakan mode 'expanded' dengan 'relatedTerms' ketika user mencari task berdasarkan topik/konsep umum.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Konsep atau kata kunci pencarian utama dari user",
        },
        keyword: {
          type: "string",
          description: "Kata kunci pencarian opsional (backwards compatibility)",
        },
        relatedTerms: {
          type: "array",
          items: { type: "string" },
          description: "Daftar kata kunci terkait, sinonim, istilah bahasa Indonesia/Inggris, singkatan, atau istilah teknis terkait dalam mode 'expanded' (max 15 istilah)",
        },
        searchMode: {
          type: "string",
          enum: ["keyword", "expanded"],
          description: "Mode pencarian: 'keyword' untuk pencarian persis/kode/judul spesifik; 'expanded' untuk pencarian topik/konsep",
        },
        limit: {
          type: "number",
          description: "Jumlah maksimal hasil (default: 20, max: 50)",
        },
      },
    },
  },
  {
    name: "get_project",
    description: "Mengambil informasi detail project berdasarkan project ID (numeric ID)",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: ["number", "string"],
          description: "ID numerik dari project",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_project_tasks",
    description: "Mengambil daftar task dalam sebuah project berdasarkan project ID dengan filter status opsional",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: ["number", "string"],
          description: "ID numerik dari project",
        },
        status: {
          type: "string",
          description: "Filter status task (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')",
        },
        limit: {
          type: "number",
          description: "Jumlah maksimal hasil (default: 20, max: 50)",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "search_projects",
    description: "Mencari project berdasarkan nama atau keyword project",
    inputSchema: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Nama atau keyword project",
        },
        limit: {
          type: "number",
          description: "Jumlah maksimal hasil (default: 10, max: 20)",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "count_project_tasks",
    description: "Menghitung jumlah total task dalam sebuah project berdasarkan project ID dengan filter status opsional",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: ["number", "string"],
          description: "ID numerik dari project",
        },
        status: {
          type: "string",
          description: "Filter status task (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_overdue_tasks",
    description: "Mengambil daftar task yang overdue (due date telah lewat dan status belum DONE) dalam sebuah project berdasarkan project ID",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: ["number", "string"],
          description: "ID numerik dari project",
        },
        limit: {
          type: "number",
          description: "Jumlah maksimal hasil (default: 50, max: 100)",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "list_projects",
    description: "Mengambil seluruh daftar project yang dapat diakses (authorized) oleh user yang sedang login",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Jumlah maksimal hasil (default: 50, max: 100)",
        },
      },
    },
  },
  {
    name: "count_assigned_tasks",
    description: "Menghitung jumlah total task dalam sebuah project yang ditugaskan kepada SAYA (user yang sedang login) berdasarkan project ID",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: ["number", "string"],
          description: "ID numerik dari project",
        },
        status: {
          type: "string",
          description: "Filter status task opsional (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')",
        },
      },
      required: ["project_id"],
    },
  },
];

export async function handleDirectToolCall(name: string, args: Record<string, any>) {
  switch (name) {
    case "get_task":
      return await executeGetTask(args as any);
    case "search_tasks":
      return await executeSearchTasks(args as any);
    case "get_project":
      return await executeGetProject(args as any);
    case "get_project_tasks":
      return await executeGetProjectTasks(args as any);
    case "search_projects":
      return await executeSearchProjects(args as any);
    case "count_project_tasks":
      return await executeCountProjectTasks(args as any);
    case "get_overdue_tasks":
      return await executeGetOverdueTasks(args as any);
    case "list_projects":
      return await executeListProjects(args as any);
    case "count_assigned_tasks":
      return await executeCountAssignedTasks(args as any, 0);
    default:
      throw new Error(`Unknown tool name: '${name}'`);
  }
}
