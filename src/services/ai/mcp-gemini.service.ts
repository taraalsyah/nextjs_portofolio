import { handleAuthorizedToolCall } from "@/services/mcp/authorized-tools";

export interface ChatHistoryMessage {
  role: "user" | "assistant" | "model";
  content: string;
}

export interface RunTaskAiInput {
  message: string;
  userId: number;
  history?: ChatHistoryMessage[];
}

export interface RunTaskAiOutput {
  answer: string;
  toolCallsUsed?: string[];
}

/**
 * Gemini Function Declarations for Gemini REST API v1beta
 */
const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "get_task",
    description: "Mengambil informasi detail task berdasarkan task ID atau taskNumber (contoh: 'A-1234' atau '12')",
    parameters: {
      type: "OBJECT",
      properties: {
        task_id: {
          type: "STRING",
          description: "ID task atau taskNumber (contoh: 'A-1234' atau '12')",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "search_tasks",
    description: "Mencari task berdasarkan kata kunci/keyword pada taskNumber, judul, deskripsi, atau tag (Gunakan HANYA jika mencari kata kunci dalam isi/judul task, BUKAN untuk mencari nama project)",
    parameters: {
      type: "OBJECT",
      properties: {
        keyword: {
          type: "STRING",
          description: "Kata kunci pencarian isi/judul task",
        },
        limit: {
          type: "NUMBER",
          description: "Jumlah maksimal hasil (default: 10, max: 20)",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "search_projects",
    description: "Mencari project berdasarkan nama atau keyword nama project (Gunakan ini untuk menemukan ID project berdasarkan nama project)",
    parameters: {
      type: "OBJECT",
      properties: {
        keyword: {
          type: "STRING",
          description: "Nama atau keyword project (contoh: 'Icode USSD')",
        },
        limit: {
          type: "NUMBER",
          description: "Jumlah maksimal hasil (default: 10, max: 20)",
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "count_project_tasks",
    description: "Menghitung jumlah/total presisi task dalam sebuah project di database berdasarkan project ID dan filter status opsional",
    parameters: {
      type: "OBJECT",
      properties: {
        project_id: {
          type: "NUMBER",
          description: "ID numerik dari project",
        },
        status: {
          type: "STRING",
          description: "Filter status task opsional (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_project",
    description: "Mengambil informasi detail project berdasarkan project ID (numeric ID)",
    parameters: {
      type: "OBJECT",
      properties: {
        project_id: {
          type: "NUMBER",
          description: "ID numerik dari project",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_project_tasks",
    description: "Mengambil daftar task dalam sebuah project berdasarkan project ID dengan filter status opsional",
    parameters: {
      type: "OBJECT",
      properties: {
        project_id: {
          type: "NUMBER",
          description: "ID numerik dari project",
        },
        status: {
          type: "STRING",
          description: "Filter status task (misal: 'BACKLOG', 'IN_PROGRESS', 'DONE', 'CLOSED')",
        },
        limit: {
          type: "NUMBER",
          description: "Jumlah maksimal hasil (default: 20, max: 50)",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_overdue_tasks",
    description: "Mengambil daftar task yang overdue (due date telah lewat dan status belum DONE) dalam sebuah project berdasarkan project ID",
    parameters: {
      type: "OBJECT",
      properties: {
        project_id: {
          type: "NUMBER",
          description: "ID numerik dari project",
        },
        limit: {
          type: "NUMBER",
          description: "Jumlah maksimal hasil task yang dikembalikan (default: 50, max: 100)",
        },
      },
      required: ["project_id"],
    },
  },
];

const SYSTEM_INSTRUCTION_TEXT = `Kamu adalah TaskTuntas AI Assistant, asisten cerdas pengelolaan task dan project di TaskTuntas.
Tugas kamu adalah membantu user menjawab pertanyaan terkait task, project, status task, dan pencarian task berdasarkan data nyata dari MCP tools.

PEMILIHAN MCP TOOLS & ATURAN SEMANTIK PERTANYAAN (SANGAT PENTING):

1. MENAMPILKAN DAFTAR PROJECT ("Kasih daftar project", "Daftar project saya"):
   - Panggil 'search_projects' dengan keyword umum (misal: "a" atau "").
   - Tampilkan daftar nama project dan ID nya secara jelas dan rapi.
   - JANGAN menampilkan "Total Task" saat menampilkan daftar project kecuali user secara eksplisit meminta jumlah task masing-masing project.

2. MEMBEDAKAN NAMA PROJECT VS KATA KUNCI TASK:
   - Jika user menyebutkan nama project (seperti "project Icode USSD", "di project ABC", "pada project ABC", "dalam project ABC", "dari project ABC"):
     * JANGAN PERNAH menggunakan 'search_tasks' untuk mencari nama project! Nama project tersebut adalah entitas PROJECT.
     * Langkah 1: Panggil 'search_projects' dengan keyword nama project tersebut (misal: keyword = "Icode USSD") untuk mendapatkan 'project_id'.
     * Langkah 2: Setelah 'project_id' didapatkan, panggil tool berikutnya ('count_project_tasks', 'get_project_tasks', atau 'get_overdue_tasks').

3. OPERASI HITUNG / COUNT & SINGLE SOURCE OF TRUTH (berapa, jumlah, total, count, how many):
   - Satu-satunya sumber kebenaran (Single Source of Truth) untuk jumlah/total task adalah hasil dari tool 'count_project_tasks'!
   - Jika pertanyaan meminta jumlah/total task (misal: "Berapa total task project Icode USSD?" atau "Berapa task DONE pada project Icode USSD?"):
     * Langkah 1: Panggil 'search_projects' (keyword: "Icode USSD") -> dapatkan 'project_id'.
     * Langkah 2: Panggil 'count_project_tasks' (project_id: <ID>, status: "DONE" jika ada filter status).
     * Sampaikan jumlah total presisi dari hasil 'count_project_tasks'.

4. VERIFIKASI ATAU PERTANYAAN ULANG USER ("Bukannya total task Icode USSD 54?"):
   - JANGAN PERNAH percaya atau mengandalkan angka dari pesan riwayat percakapan sebelumnya sebagai kebenaran database.
   - Jika user menanyakan/memverifikasi ulang sebuah angka, SELALU jalankan tool 'count_project_tasks' atau 'get_overdue_tasks' secara langsung ke database untuk mengambil data terbaru dan jawab berdasarkan hasil terkini tersebut.

5. MENAMPILKAN DAFTAR TASK DALAM PROJECT:
   - Jika pertanyaan meminta daftar task dalam project (misal: "Tampilkan task DONE pada project Icode USSD"):
     * Langkah 1: Panggil 'search_projects' (keyword: "Icode USSD") -> dapatkan 'project_id'.
     * Langkah 2: Panggil 'get_project_tasks' (project_id: <ID>, status: "DONE").

6. PENCARIAN KATA KUNCI TASK:
   - Gunakan 'search_tasks' HANYA jika user memang secara eksplisit mencari task berdasarkan kata kunci isi/judul/deskripsi/tag task (misal: "Cari task tentang USSD", "task yang judulnya mengandung database").

7. DETAIL TASK / DETAIL PROJECT:
   - "Detail task A-1234" -> 'get_task'(task_id: "A-1234").
   - "Detail project Icode USSD" -> 'search_projects' -> 'get_project'(project_id).

8. PERTANYAAN TASK OVERDUE / LEWAT TENGGAT WAKTU ("ada yg over due time?", "berapa task overdue?", "tampilkan task overdue"):
   - Jika user menanyakan task overdue / terlambat / lewat tenggat waktu pada sebuah project:
     * Langkah 1: Panggil 'search_projects' (keyword: nama project) -> dapatkan 'project_id'.
     * Langkah 2: Panggil 'get_overdue_tasks' (project_id: <ID>).
     * JANGAN PERNAH menggunakan 'search_tasks' atau 'get_project_tasks' biasa untuk query overdue.
     * Gunakan nilai 'total' dari hasil 'get_overdue_tasks' sebagai sumber kebenaran presisi jumlah task overdue.
     * Jawab secara eksplisit: "Ya. Ada [total] task yang overdue di project [Nama Project]." lalu tampilkan daftar task overdue (jika ada) dengan penomoran berurutan (1., 2., 3., ... N).
     * JANGAN PERNAH mendasarkan angka overdue pada pesan riwayat sebelumnya atau mengandalkan koreksi user; SELALU panggil 'get_overdue_tasks' langsung ke database.

ATURAN PENOMORAN DAFTAR TASK (WAJIB SEQUENTIAL 1 ... N - SANGAT KETAT):
- Saat menampilkan daftar beberapa task (seperti hasil dari 'get_project_tasks', 'get_overdue_tasks', 'search_tasks', daftar task terfilter, dikelompokkan berdasarkan status/project, atau respon apa pun berisi beberapa record task), penomoran HARUS berurutan secara eksplisit dari 1 sampai N (1., 2., 3., 4., ... N.).
- JANGAN PERNAH mengulang penomoran '1.' untuk setiap baris task! (JANGAN PERNAH: 1. ... 1. ... 1. ...).
- JANGAN PERNAH mengandalkan penomoran otomatis markdown '1.' untuk setiap baris.
- Untuk task ke-10, 11, dst., WAJIB gunakan 10., 11., 12., dst. secara eksplisit (BUKAN 1., 1., 1.).
- Kode task / taskNumber seperti '[TSK-930002]' BUKAN nomor urut ordinal. Nomor urut adalah posisi task dalam daftar (task pertama -> 1., task kedua -> 2., task ketiga -> 3., dst.).
- Sebelum mengirim respon yang berisi daftar N task:
  1. Hitung jumlah item task yang ditampilkan (N).
  2. Berikan nomor urut 1 sampai N secara berurutan.
  3. Pastikan tidak ada dua item berurutan yang memiliki nomor sama.
  4. Pastikan penomoran tidak di-reset kembali ke 1.
  5. Pastikan task terakhir memiliki nomor N.
- Aturan ini berlaku untuk semua daftar task. Hanya koreksi penomoran/presentasi ordinal, JANGAN mengubah data task itu sendiri.

ATURAN UMUM:
- Gunakan HANYA tools yang tersedia: 'get_task', 'search_tasks', 'search_projects', 'count_project_tasks', 'get_project', 'get_project_tasks', 'get_overdue_tasks'.
- JANGAN PERNAH mengarang atau merekayasa data, jumlah, atau status.
- JANGAN PERNAH mengklaim menjalankan query SQL langsung.
- Berikan jawaban dalam bahasa Indonesia yang ramah, jelas, ringkas, dan profesional.`;

/**
 * Enforces strict sequential ordinal numbering (1...N) for task list items.
 * Strips bullet prefixes (- 1., * 1., - [TSK-..]) and guarantees clean 1...N numbering.
 */
export function enforceSequentialTaskNumbering(text: string): string {
  if (!text) return text;

  const lines = text.split(/\r?\n/);
  const resultLines: string[] = [];
  let currentOrdinal = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Match list items starting with digits ("1. ...", "- 1. ...", "* 1. ...")
    const numberedMatch = /^(\s*)(?:[\*\-]\s+)?(\d+)\.\s+(.+)$/.exec(line);
    // Match bullet items starting with "- [TSK-..." or "* [TSK-..."
    const bulletTaskMatch = /^(\s*)[\*\-]\s+(\[TSK-.*|Task\s+\d+.*)$/i.exec(line);

    if (numberedMatch) {
      currentOrdinal++;
      const indent = numberedMatch[1] || "";
      const rest = numberedMatch[3];
      resultLines.push(`${indent}${currentOrdinal}. ${rest}`);
    } else if (bulletTaskMatch) {
      currentOrdinal++;
      const indent = bulletTaskMatch[1] || "";
      const rest = bulletTaskMatch[2];
      resultLines.push(`${indent}${currentOrdinal}. ${rest}`);
    } else {
      const isBlank = trimmed === "";
      let nextIsListItem = false;

      if (isBlank) {
        for (let j = i + 1; j < lines.length; j++) {
          const nextTrimmed = lines[j].trim();
          if (nextTrimmed === "") continue;
          if (
            /^(?:[\*\-]\s+)?\d+\.\s+/.test(nextTrimmed) ||
            /^[\*\-]\s+\[TSK-/i.test(nextTrimmed)
          ) {
            nextIsListItem = true;
          }
          break;
        }
      }

      if (!isBlank || !nextIsListItem) {
        currentOrdinal = 0;
      }
      resultLines.push(line);
    }
  }

  return resultLines.join("\n");
}

/**
 * Main engine executing Gemini 3.5 Flash Lite / Gemini API with MCP Tool Calling
 */
export async function runTaskAiAssistant({
  message,
  userId,
  history = [],
}: RunTaskAiInput): Promise<RunTaskAiOutput> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.DEEPSEEK_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY belum dikonfigurasi pada environment server."
    );
  }

  const candidateModels = Array.from(
    new Set([
      ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash-8b",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash",
    ])
  );

  let activeModelIndex = 0;

  // Build initial contents array for Gemini REST API
  const contents: any[] = [];

  // Reconstruct conversation history if provided
  if (history && history.length > 0) {
    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  // Append latest user message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const toolCallsUsed: string[] = [];
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION_TEXT }],
      },
      contents,
      tools: [
        {
          functionDeclarations: GEMINI_FUNCTION_DECLARATIONS,
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    };

    let response: Response | null = null;
    let errText = "";

    // Try candidate models if status 404 occurs
    while (activeModelIndex < candidateModels.length) {
      const currentModel = candidateModels[activeModelIndex];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if ((response.status === 404 || response.status === 503 || response.status === 429) && activeModelIndex + 1 < candidateModels.length) {
        console.warn(`[Gemini API] Model '${currentModel}' returned status ${response.status}. Falling back to '${candidateModels[activeModelIndex + 1]}'...`);
        activeModelIndex++;
        continue;
      }

      if (!response.ok) {
        errText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errText}`);
      }

      break;
    }

    if (!response || !response.ok) {
      throw new Error(`Gemini API Error: Tidak dapat terhubung ke model Gemini (${errText})`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate || !candidate.content) {
      throw new Error("Gemini API tidak mengembalikan respon kandidat yang valid.");
    }

    const parts = candidate.content.parts || [];
    let hasFunctionCall = false;

    // Check if Gemini requested function call(s)
    for (const part of parts) {
      if (part.functionCall) {
        hasFunctionCall = true;
        const call = part.functionCall;
        const name = call.name;
        const args = call.args || {};

        toolCallsUsed.push(name);

        // Execute authorized tool call server-side
        const toolResultText = await handleAuthorizedToolCall(name, args, userId);

        // Append model's functionCall turn to contents
        contents.push({
          role: "model",
          parts: [part],
        });

        // Append functionResponse turn to contents (role must be 'user' for Gemini REST API)
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  name,
                  content: toolResultText,
                },
              },
            },
          ],
        });

        break;
      }
    }

    // If no function call, Gemini provided the final natural language answer
    if (!hasFunctionCall) {
      const textAnswer = parts
        .map((p: any) => p.text || "")
        .join("\n")
        .trim();

      if (!textAnswer) {
        return {
          answer: "Maaf, tidak ada informasi yang dapat ditampilkan.",
          toolCallsUsed,
        };
      }

      const formattedAnswer = enforceSequentialTaskNumbering(textAnswer);

      return {
        answer: formattedAnswer,
        toolCallsUsed,
      };
    }
  }

  return {
    answer: "Permintaan memproses jawaban AI telah melebihi batas batas iterasi tool.",
    toolCallsUsed,
  };
}
