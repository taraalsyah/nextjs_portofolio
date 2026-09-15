import { handleAuthorizedToolCall } from "@/services/mcp/authorized-tools";
import { SAFE_AI_ERROR_MESSAGE } from "@/services/mcp/error-handler";

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
    description: "Mencari dan memfilter task dalam database berdasarkan kata kunci, topik, status, excludeStatuses (pengecualian status seperti ['DONE'] untuk mencari task yang BELUM SELESAI), prioritas, atau proyek.\n\nUNTUK QUERY TASK BELUM SELESAI ('Task yang belum selesai apa aja?', 'task belum selesai', 'unfinished tasks'):\n- Panggil 'search_tasks' langsung dengan excludeStatuses: ['DONE'], limit: 20, offset: 0.\n- JANGAN PERNAH meminta user menyebutkan nama project hanya karena project tidak disebutkan dalam query!\n\nMode 'keyword' untuk pencarian persis/kode task; 'expanded' untuk topik/konsep.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Konsep atau kata kunci pencarian utama dari user",
        },
        keyword: {
          type: "STRING",
          description: "Kata kunci pencarian opsional",
        },
        relatedTerms: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
          description: "Daftar istilah terkait untuk mode 'expanded'",
        },
        searchMode: {
          type: "STRING",
          enum: ["keyword", "expanded"],
          description: "Mode pencarian: 'keyword' atau 'expanded'",
        },
        status: {
          type: "STRING",
          description: "Filter status spesifik opsional (misal: 'OPEN', 'IN_PROGRESS', 'BACKLOG')",
        },
        statuses: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
          description: "Daftar status inklusif opsional",
        },
        excludeStatuses: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
          description: "Daftar status yang dikecualikan (contoh: ['DONE'] untuk mencari task yang BELUM SELESAI)",
        },
        priority: {
          type: "STRING",
          description: "Filter prioritas opsional (misal: 'HIGH', 'MEDIUM', 'LOW')",
        },
        projectId: {
          type: "NUMBER",
          description: "ID numerik project opsional jika user menyebutkan project spesifik",
        },
        assigned_to_me: {
          type: "BOOLEAN",
          description: "Set true jika user menanyakan task miliknya/yang ditugaskan ke dirinya sendiri",
        },
        overdue: {
          type: "BOOLEAN",
          description: "Set true jika user menanyakan task yang overdue/terlambat/lewat tenggat",
        },
        datePreset: {
          type: "STRING",
          enum: ["TODAY", "YESTERDAY", "TOMORROW", "THIS_WEEK", "LAST_WEEK", "THIS_MONTH", "LAST_MONTH"],
          description: "Preset rentang tanggal relatif (misal: 'TODAY' untuk pertanyaan seperti 'Ada task yang selesai hari ini?')",
        },
        limit: {
          type: "NUMBER",
          description: "Jumlah maksimal hasil task yang dikembalikan (default: 10, max: 20)",
        },
        offset: {
          type: "NUMBER",
          description: "Posisi awal hasil untuk pagination (default: 0)",
        },
      },
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
    description: "Mengambil daftar task dalam sebuah project berdasarkan project ID dengan filter status opsional dan filter ditugaskan ke saya opsional",
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
        assigned_to_me: {
          type: "BOOLEAN",
          description: "Set true jika user menanyakan task yang ditugaskan kepada dirinya sendiri ('saya' / 'aku' / 'my')",
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
  {
    name: "list_projects",
    description: "Mengambil seluruh daftar project yang dapat diakses (authorized) oleh user yang sedang login",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: {
          type: "NUMBER",
          description: "Jumlah maksimal hasil project yang dikembalikan (default: 50, max: 100)",
        },
      },
    },
  },
  {
    name: "count_assigned_tasks",
    description: "Menghitung jumlah presisi task yang DITUGASKAN KEPADA SAYA (user yang sedang login) dalam sebuah project berdasarkan project ID dan filter status opsional",
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
    name: "get_current_datetime",
    description: "Mengambil tanggal, waktu, dan timezone aktual dari server TaskTuntas (default Asia/Jakarta). Gunakan ini saat user menanyakan tanggal/waktu saat ini ('hari ini tanggal berapa?', 'jam berapa sekarang?').",
    parameters: {
      type: "OBJECT",
      properties: {
        timezone: {
          type: "STRING",
          description: "Timezone opsional (default 'Asia/Jakarta')",
        },
      },
    },
  },
];

const SYSTEM_INSTRUCTION_TEXT = `Kamu adalah TaskTuntas AI Assistant, asisten cerdas pengelolaan task dan project di TaskTuntas.
Tugas kamu adalah membantu user menjawab pertanyaan terkait task, project, status task, dan pencarian task berdasarkan data nyata dari MCP tools.

PEMILIHAN MCP TOOLS & ATURAN SEMANTIK PERTANYAAN (SANGAT PENTING):

1. MENAMPILKAN DAFTAR PROJECT ATAU JUMLAH PROJECT USER ("ada berapa project", "kasih daftar project", "list project saya", "project apa saja yang saya punya", "berapa project di akun saya"):
   - WAJIB panggil 'list_projects' secara langsung!
   - JANGAN PERNAH menggunakan 'search_projects' dengan kata kunci umum/dummy (seperti "a" atau "").
   - Gunakan nilai 'total' dari hasil 'list_projects' sebagai sumber kebenaran presisi untuk jumlah total project di akun user.
   - Tampilkan seluruh nama project dan ID nya secara jelas dan rapi.

2. MEMBEDAKAN PENCARIAN NAMA PROJECT VS LIST PROJECT:
   - "ada berapa project" / "daftar project saya" / "list project" -> 'list_projects'.
   - "cari project bernama X" / "detail project X" -> 'search_projects'(keyword: "X").
   - Jika user menyebutkan nama project spesifik (seperti "project Icode USSD", "di project ABC", "pada project ABC", "dalam project ABC", "dari project ABC"):
     * JANGAN PERNAH menggunakan 'search_tasks' untuk mencari nama project! Nama project tersebut adalah entitas PROJECT.
     * Langkah 1: Panggil 'search_projects' dengan keyword nama project tersebut (misal: keyword = "Icode USSD") untuk mendapatkan 'project_id'.
     * Langkah 2: Setelah 'project_id' didapatkan, panggil tool berikutnya ('count_project_tasks', 'count_assigned_tasks', 'get_project_tasks', atau 'get_overdue_tasks').

3. OPERASI HITUNG / COUNT & SINGLE SOURCE OF TRUTH (berapa, jumlah, total, count, how many):
   - Satu-satunya sumber kebenaran (Single Source of Truth) untuk jumlah/total task adalah hasil dari tool 'count_project_tasks'!
   - Jika pertanyaan meminta jumlah/total task (misal: "Berapa total task project Icode USSD?" atau "Berapa task DONE pada project Icode USSD?"):
     * Langkah 1: Panggil 'search_projects' (keyword: "Icode USSD") -> dapatkan 'project_id'.
     * Langkah 2: Panggil 'count_project_tasks' (project_id: <ID>, status: "DONE" jika ada filter status).
     * Sampaikan jumlah total presisi dari hasil 'count_project_tasks'.

4. VERIFIKASI ATAU PERTANYAAN ULANG USER ("Bukannya total task Icode USSD 54?" atau "Bukannya ada project X?"):
   - JANGAN PERNAH percaya atau mengandalkan angka dari pesan riwayat percakapan sebelumnya sebagai kebenaran database.
   - Jika user menanyakan/memverifikasi ulang daftar/jumlah project, SELALU panggil 'list_projects' secara langsung ke database untuk mengambil data terbaru dan jawab berdasarkan hasil terkini tersebut.

5. MENAMPILKAN DAFTAR TASK DALAM PROJECT:
   - Jika pertanyaan meminta daftar task dalam project (misal: "Tampilkan task DONE pada project Icode USSD"):
     * Langkah 1: Panggil 'search_projects' (keyword: "Icode USSD") -> dapatkan 'project_id'.
     * Langkah 2: Panggil 'get_project_tasks' (project_id: <ID>, status: "DONE").

6. PENCARIAN KATA KUNCI & KONSEP TASK (search_tasks):
   - Gunakan 'search_tasks' saat user mencari task berdasarkan isi/judul/deskripsi/tag/topik/konsep task.
   - PENCARIAN PERSIS ("cari task dengan judul Network WIFI" / "task A-1234"):
     * Gunakan query: "Network WIFI", searchMode: "keyword", relatedTerms: [].
   - PENCARIAN KONSEP / TOPIK ("carikan task yang berkaitan dengan network" / "task seputar internet"):
     * Gunakan query: "network", searchMode: "expanded".
     * Hasikan istilah terkait, sinonim Indonesia/Inggris, singkatan, atau istilah teknis relevan dalam 'relatedTerms' (contoh: ["jaringan", "internet", "koneksi", "wifi", "LAN", "WAN", "router", "switch", "DNS", "VPN"]).
   - Kembalikan SELURUH task yang cocok hingga batas limit (default 20, max 50), JANGAN membatasi jawaban hanya pada 1 task.

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

9. PERTANYAAN TASK "DITUGASKAN KE SAYA" / "SAYA" / "AKU" / "MY TASKS" ("ditugaskan ke saya berapa?", "task saya", "tugas saya", "my tasks"):
   - Identitas "saya" / "aku" / "my" HARUS SELALU berasal dari server-side authenticated session user.
   - JANGAN PERNAH mencari user berdasarkan nama (JANGAN cari "Tara Alsyah", "Tara Alsyah Icode", atau nama lain dari prompt/nama user)!
   - JANGAN PERNAH mencoba menebak user ID atau mempassing nama user ke search_tasks untuk menentukan current user.
   - Jika user menanyakan JUMLAH task yang ditugaskan ke SAYA di project X:
     * Langkah 1: Panggil 'search_projects' (keyword: nama project X) -> dapatkan 'project_id'.
     * Langkah 2: Panggil 'count_assigned_tasks' (project_id: <ID>, status: "..." jika ada filter status).
     * Sampaikan jumlah total presisi dari hasil 'count_assigned_tasks'.
   - Jika user meminta DAFTAR task yang ditugaskan ke SAYA di project X:
     * Langkah 1: Panggil 'search_projects' (keyword: nama project X) -> dapatkan 'project_id'.
     * Langkah 2: Panggil 'get_project_tasks' (project_id: <ID>, assigned_to_me: true, status: "..." jika ada filter status).

10. ANALISIS DURASI PENGERJAAN & TIMESTAMP SELESAI TASK DONE ("Berapa rata-rata waktu task sampai selesai?", "Berapa lama rata-rata task DONE dikerjakan?", "Hitung durasi pengerjaan task DONE"):
    - Saat user meminta analisis durasi pengerjaan / waktu penyelesaian task DONE:
      * Langkah 1: Ambil task berstatus DONE menggunakan 'get_project_tasks' (status: "DONE") atau 'search_tasks'.
      * Langkah 2: Dapatkan data timestamp: 'taskNumber', 'title', 'createdAt', 'updatedAt', 'doneReviewedAt' (jika ada), dan 'dueDate'.
      * ATURAN SELEKSI TIMESTAMP SELESAI (completionTimestamp):
        1. Gunakan 'doneReviewedAt' sebagai timestamp selesai utama jika tersedia dan terisi (mencatat transisi tepat saat status menjadi DONE).
        2. Jika 'doneReviewedAt' tidak ada/null, gunakan 'updatedAt' HANYA jika dipastikan 'updatedAt' merepresentasikan momen transisi perubahan status ke DONE dan task tidak pernah diedit lagi setelah berstatus DONE.
        3. JANGAN PERNAH berasumsi semua 'updatedAt' pasti timestamp selesai jika task mungkin diedit setelah DONE. Jika timestamp transisi DONE asli tidak dapat dipastikan secara handal, JANGAN mengarang timestamp.
        4. JANGAN PERNAH menggunakan 'dueDate' sebagai timestamp selesai (dueDate adalah tenggat waktu/deadline, bukan waktu penyelesaian aktual). JANGAN PERNAH menghitung (dueDate - createdAt) sebagai durasi pengerjaan.
        5. JANGAN PERNAH mengarang atau memfabrikasi timestamp selesai.
      * Langkah 3: Untuk setiap task valid: duration = completionTimestamp - createdAt.
      * Langkah 4: Kecualikan task DONE yang timestamp selesainya tidak dapat dipastikan secara handal.
      * Langkah 5: Hitung rata-rata durasi HANYA dari task-task yang valid.
      * STRUKTUR JAWABAN ANALISIS (WAJIB EKSPLISIT DAN TRANSPARAN):
        - Sebutkan total task berstatus DONE.
        - Sebutkan jumlah task yang dimasukkan dalam kalkulasi (valid).
        - Sebutkan jumlah task yang dikecualikan (jika ada).
        - Sebutkan rata-rata durasi pengerjaan yang dihitung.
        - Sebutkan secara jelas timestamp yang digunakan sebagai waktu penyelesaian (misal: createdAt -> doneReviewedAt atau createdAt -> updatedAt transisi DONE).
        - Contoh format respon: "Berdasarkan 6 task DONE dengan timestamp penyelesaian yang valid, rata-rata durasi pengerjaan dari createdAt hingga selesai adalah 2 hari 7 jam. Untuk kalkulasi ini, updatedAt/doneReviewedAt digunakan sebagai timestamp penyelesaian karena aplikasi memperbarui timestamp tersebut saat status task berubah menjadi DONE. 2 task DONE dikecualikan karena timestamp penyelesaiannya tidak dapat dipastikan secara handal."

QUERY INTENT RULE & PENCARIAN TASK BELUM SELESAI:

Tidak semua query task tanpa project harus diklarifikasi.
Jika user sudah memberikan filter yang jelas (seperti status, exclude status, priority, task saya, overdue, tanggal, dsb.), LANGSUNG proses query tersebut!

1. PERTANYAAN TASK BELUM SELESAI ("Task yang belum selesai apa aja?", "task belum selesai", "tampilkan task unfinished", "task saya yang belum selesai"):
   - Ini ADALAH QUERY SPESIFIK yang valid dengan filter status.
   - JANGAN PERNAH meminta user menyebutkan nama project hanya karena project tidak disebutkan dalam query!
   - Langsung panggil 'search_tasks' dengan: { excludeStatuses: ["DONE"], limit: 20, offset: 0 }.
   - Interpretasikan "belum selesai" sebagai task berstatus selain DONE/CLOSED (di database TaskTuntas: status BACKLOG, OPEN, IN_PROGRESS).
   - Setelah mendapatkan hasil dari 'search_tasks', SEGERA buat jawaban akhir. JANGAN mengulang panggil tool yang sama.

2. QUERY DENGAN FILTER SPESIFIK LAIN TANPA PROJECT:
   - "Task HIGH apa aja?" -> search_tasks(priority: "HIGH")
   - "Task DONE apa aja?" -> search_tasks(status: "DONE")
   - "Task saya apa aja?" -> search_tasks(assigned_to_me: true)
   - "Task overdue apa aja?" -> search_tasks(overdue: true) atau get_overdue_tasks
   - Project HANYA menjadi filter tambahan jika user menyebutkannya secara eksplisit.

3. MENCEGAH REPEATED TOOL CALLS & LOOP:
   - Jangan pernah mengulang panggil tool yang sama dengan argumen yang sama dalam satu user request.
   - Jika hasil 'search_tasks' sudah diperoleh, gunakan data hasil tersebut untuk membuat final answer. JANGAN melakukan tool call tambahan hanya untuk memastikan hasil yang sudah ada.

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
- Gunakan HANYA tools yang tersedia: 'get_task', 'search_tasks', 'search_projects', 'list_projects', 'count_project_tasks', 'count_assigned_tasks', 'get_project', 'get_project_tasks', 'get_overdue_tasks'.
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

export type QueryScope =
  | "NONE"
  | "PROJECT"
  | "MY_TASKS"
  | "STATUS"
  | "PRIORITY"
  | "ASSIGNEE"
  | "KEYWORD"
  | "OVERDUE"
  | "DATE"
  | "ALL"
  | "TASK_NUMBER";

export interface PreQueryGateResult {
  scope: QueryScope;
  requiresClarification: boolean;
  clarificationQuestion?: string;
}

/**
 * Deterministic Pre-Query Gate
 * Evaluated BEFORE Gemini REST API fetch & BEFORE any MCP tool execution.
 */
export function getPreQueryGate(message: string): PreQueryGateResult {
  if (!message || typeof message !== "string") {
    return {
      scope: "NONE",
      requiresClarification: true,
      clarificationQuestion:
        "Mau menampilkan task dari project tertentu, task kamu, atau berdasarkan status/priority tertentu?",
    };
  }

  const rawClean = message.trim().toLowerCase();
  const normalized = rawClean
    .replace(/[?.,!/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const EXACT_BROAD_QUERIES = new Set([
    "tampilkan task",
    "tampilkan tasks",
    "lihat task",
    "lihat tasks",
    "list task",
    "list tasks",
    "show task",
    "show tasks",
    "cari task",
    "cari tasks",
    "daftar task",
    "daftar tasks",
    "apa saja task",
    "apa saja tasks",
    "kasih task",
    "kasih tasks",
    "tampilkan daftar task",
    "tampilkan beberapa task",
    "lihat daftar task",
    "list daftar task",
    "show task list",
    "show tasks list",
  ]);

  if (EXACT_BROAD_QUERIES.has(normalized)) {
    return {
      scope: "NONE",
      requiresClarification: true,
      clarificationQuestion:
        "Mau menampilkan task dari project tertentu, task kamu, atau berdasarkan status/priority tertentu?",
    };
  }

  // 1. Task Number (e.g. TSK-420004, A-1234)
  if (/\b(?:tsk|a|t)-\d+\b/i.test(normalized) || /\btask\s+\d+\b/i.test(normalized)) {
    return { scope: "TASK_NUMBER", requiresClarification: false };
  }

  // 2. My tasks / User scope
  if (
    /\b(saya|aku|my|milik saya|tugas saya|task saya|ditugaskan ke saya|assigned to me)\b/i.test(
      normalized
    )
  ) {
    return { scope: "MY_TASKS", requiresClarification: false };
  }

  // 3. Priority scope
  if (/\b(high|medium|low|prioritas|priority)\b/i.test(normalized)) {
    return { scope: "PRIORITY", requiresClarification: false };
  }

  // 4. Status scope
  if (
    /\b(done|open|in progress|in_progress|backlog|closed|selesai|belum selesai|status)\b/i.test(
      normalized
    )
  ) {
    return { scope: "STATUS", requiresClarification: false };
  }

  // 5. Overdue scope
  if (/\b(overdue|over due|terlambat|tenggat|lewat tenggat)\b/i.test(normalized)) {
    return { scope: "OVERDUE", requiresClarification: false };
  }

  // 6. Project scope
  if (
    /\b(project|proyek|di project|pada project|dalam project|dari project)\b/i.test(
      normalized
    )
  ) {
    return { scope: "PROJECT", requiresClarification: false };
  }

  // 7. Explicit ALL scope
  if (/\b(semua|seluruh|all|every)\b/i.test(normalized)) {
    return { scope: "ALL", requiresClarification: false };
  }

  // 8. Keyword / Topic search indicators
  if (
    /\b(tentang|seputar|berkaitan|mengenai|berhubungan|dengan kata|judul|deskripsi|tag|tags)\b/i.test(
      normalized
    )
  ) {
    return { scope: "KEYWORD", requiresClarification: false };
  }

  // 9. Date scope
  if (
    /\b(hari ini|minggu ini|bulan ini|kemarin|besok|created|updated|due|deadline)\b/i.test(
      normalized
    )
  ) {
    return { scope: "DATE", requiresClarification: false };
  }

  // Strip filler words to test if remaining message is just an action + task phrase
  const strippedFiller = normalized
    .replace(/\b(tolong|dong|ya|nya|bisa|minta|bantu|please|kah|tampilkan|lihat|list|show|cari|daftar)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (strippedFiller === "" || strippedFiller === "task" || strippedFiller === "tasks") {
    return {
      scope: "NONE",
      requiresClarification: true,
      clarificationQuestion:
        "Mau menampilkan task dari project tertentu, task kamu, atau berdasarkan status/priority tertentu?",
    };
  }

  return { scope: "KEYWORD", requiresClarification: false };
}

/**
 * Main engine executing Gemini 3.5 Flash Lite / Gemini API with MCP Tool Calling
 */
export async function runTaskAiAssistant({
  message,
  userId,
  history = [],
}: RunTaskAiInput): Promise<RunTaskAiOutput> {
  // Execute deterministic pre-query gate BEFORE any Gemini API call or MCP execution
  const gate = getPreQueryGate(message);
  if (gate.requiresClarification) {
    return {
      answer:
        gate.clarificationQuestion ||
        "Mau menampilkan task dari project tertentu, task kamu, atau berdasarkan status/priority tertentu?",
      toolCallsUsed: [],
    };
  }
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
  const executedToolSignatures = new Set<string>();
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

        const toolSignature = `${name}:${JSON.stringify(args)}`;
        toolCallsUsed.push(name);

        let toolResultText: string;
        if (executedToolSignatures.has(toolSignature)) {
          console.warn(`[TaskAiAssistant] Duplicate tool call detected: ${toolSignature}. Returning previous result notice.`);
          toolResultText = JSON.stringify({
            notice: `Tool '${name}' dengan parameter tersebut sudah pernah dieksekusi pada iterasi sebelumnya. Gunakan data hasil sebelumnya untuk membuat jawaban akhir kepada user. JANGAN memanggil tool ini lagi.`,
          });
        } else {
          executedToolSignatures.add(toolSignature);
          toolResultText = await handleAuthorizedToolCall(name, args, userId);
        }

        if (toolResultText.includes("INTERNAL_ERROR") || toolResultText.includes(SAFE_AI_ERROR_MESSAGE)) {
          console.warn(`[TaskAiAssistant] Internal error detected in tool '${name}' execution. Stopping tool loop.`);
          return {
            answer: SAFE_AI_ERROR_MESSAGE,
            toolCallsUsed,
          };
        }

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
