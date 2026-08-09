/**
 * Coverage checker for "task_management_knowledge_base_lengkap.pdf"
 * (document_id 23 — a much richer knowledge base than
 * Task_Management_Workflow_Portofolio.pdf, document_id 21).
 *
 * This script is a DISCOVERY tool, not a strict pass/fail suite: it prints
 * the top result + preview + a soft keyword check so you can eyeball
 * correctness before promoting a query into test-vector-search.mjs as a
 * locked regression test.
 *
 * SPECIAL FOCUS: this document overlaps heavily in vocabulary with the
 * OTHER task-management document (doc 21) — both talk about "status",
 * "task", "approval", "Request to Done", etc. That makes cross-document
 * precision (doc 21 vs doc 23) the single riskiest area here, on top of
 * the usual doc 20 (CV) vs doc 21/23 distractor risk. A dedicated
 * category below checks specifically for that.
 *
 * Usage:
 *   node test-tmkb-coverage.mjs
 *   node test-tmkb-coverage.mjs --base-url http://127.0.0.1:3000
 *   node test-tmkb-coverage.mjs --category "Cross-document"
 */

const BASE_URL =
  process.argv.includes("--base-url")
    ? process.argv[process.argv.indexOf("--base-url") + 1]
    : "http://localhost:3000";

const categoryFilter =
  process.argv.includes("--category")
    ? process.argv[process.argv.indexOf("--category") + 1].toLowerCase()
    : null;

const ENDPOINT = `${BASE_URL}/api/test-vector-search`;

const questions = [
  // ---------- 1. Definition & Core Concepts ----------
  {
    category: "Definition & Core Concepts",
    query: "Apa itu Task Management?",
    expectedKeywords: ["mencatat pekerjaan", "bertanggung jawab", "prioritas"],
  },
  {
    category: "Definition & Core Concepts",
    query: "Apakah task bisa dilihat oleh semua user?",
    expectedKeywords: ["bukan objek global", "tidak dapat dilihat semua user"],
  },
  {
    category: "Definition & Core Concepts",
    query: "Apa itu Assignee?",
    expectedKeywords: ["bertanggung jawab", "mengerjakan"],
  },

  // ---------- 2. Roles & Permissions ----------
  {
    category: "Roles & Permissions",
    query: "Apa saja role yang ada di project?",
    expectedKeywords: ["Owner", "Admin", "Member", "Viewer"],
  },
  {
    category: "Roles & Permissions",
    query: "Apa tanggung jawab Owner project?",
    expectedKeywords: ["otoritas tertinggi", "Kelola project"],
  },
  {
    category: "Roles & Permissions",
    query: "Siapa yang bisa mengubah role member?",
    expectedKeywords: ["Owner"],
  },
  {
    category: "Roles & Permissions",
    query: "Apakah frontend saja cukup untuk validasi permission?",
    expectedKeywords: ["Tidak", "backend wajib", "authorization"],
  },

  // ---------- 3. Status Lifecycle ----------
  {
    category: "Status Lifecycle",
    query: "Apa saja status task di knowledge base ini?",
    expectedKeywords: ["Backlog", "Open", "In Progress", "Done"],
  },
  {
    category: "Status Lifecycle",
    query: "Apa status final task?",
    expectedKeywords: ["Done", "final"],
  },
  {
    category: "Status Lifecycle",
    query: "Apakah task Done bisa pindah ke status lain?",
    expectedKeywords: ["Tidak diperbolehkan", "final"],
  },
  {
    category: "Status Lifecycle",
    query: "Bagaimana urutan transisi status dari Backlog ke Done?",
    expectedKeywords: ["Open", "In Progress", "Request to Done"],
  },

  // ---------- 4. Approval Workflow ----------
  {
    category: "Approval Workflow",
    query: "Bagaimana alur approval Request to Done?",
    expectedKeywords: ["Owner/Admin", "review", "disetujui"],
  },
  {
    category: "Approval Workflow",
    query: "Apakah Request to Done langsung membuat task jadi Done?",
    expectedKeywords: ["bukan berarti", "permintaan approval"],
  },
  {
    category: "Approval Workflow",
    query: "Apa yang terjadi kalau Request to Done ditolak Owner?",
    expectedKeywords: ["tidak berubah menjadi Done", "aktif"],
  },

  // ---------- 5. Priority & Category ----------
  {
    category: "Priority & Category",
    query: "Apa saja tingkat priority task?",
    expectedKeywords: ["Low", "Medium", "High", "Critical"],
  },
  {
    category: "Priority & Category",
    query: "Apa yang dimaksud priority Critical?",
    expectedKeywords: ["urgent", "perhatian segera"],
  },
  {
    category: "Priority & Category",
    query: "Contoh category task apa saja?",
    expectedKeywords: ["Development", "Bug", "Design"],
  },

  // ---------- 6. Task Fields ----------
  {
    category: "Task Fields",
    query: "Field apa saja yang ada pada sebuah task?",
    expectedKeywords: ["Task ID", "Title", "Assignee", "Due Date"],
  },

  // ---------- 7. CRUD Operations ----------
  {
    category: "CRUD Operations",
    query: "Bagaimana langkah-langkah membuat task baru?",
    expectedKeywords: ["form Create Task", "permission", "database"],
  },
  {
    category: "CRUD Operations",
    query: "Apakah task Done bisa diedit?",
    expectedKeywords: ["tidak boleh diedit"],
  },
  {
    category: "CRUD Operations",
    query: "Bagaimana cara menghapus task?",
    expectedKeywords: ["confirmation popup", "permission"],
  },
  {
    category: "CRUD Operations",
    query: "Apakah task Done bisa dihapus?",
    expectedKeywords: ["tidak boleh dihapus"],
  },

  // ---------- 8. Filter & Search ----------
  {
    category: "Filter & Search",
    query: "Apa saja filter yang tersedia untuk task?",
    expectedKeywords: ["Status", "Priority", "Assignee", "Due Date"],
  },
  {
    category: "Filter & Search",
    query: "Berdasarkan apa saja task bisa dicari?",
    expectedKeywords: ["Title", "Task ID", "Tags"],
  },

  // ---------- 9. UI Components (List, Kanban, Detail) ----------
  {
    category: "UI Components",
    query: "Apa fungsi Kanban Board?",
    expectedKeywords: ["Backlog", "Open", "In Progress", "Done", "visual"],
  },
  {
    category: "UI Components",
    query: "Apakah task Done bisa dipindahkan kembali di Kanban?",
    expectedKeywords: ["tidak boleh dipindahkan kembali"],
  },
  {
    category: "UI Components",
    query: "Apa saja yang ditampilkan di Task Detail?",
    expectedKeywords: ["title", "description", "priority", "assignee"],
  },

  // ---------- 10. Mobile & UX ----------
  {
    category: "Mobile & UX",
    query: "Bagaimana Task Management menangani tampilan mobile?",
    expectedKeywords: ["full-screen", "responsif"],
  },
  {
    category: "Mobile & UX",
    query: "Apa yang harus terjadi saat proses async seperti create task berjalan?",
    expectedKeywords: ["loading state", "disable tombol"],
  },

  // ---------- 11. Security & Backend Validation ----------
  {
    category: "Security & Backend Validation",
    query: "Apa saja urutan pemeriksaan backend saat memodifikasi task?",
    expectedKeywords: ["authenticated", "member project", "permission"],
  },
  {
    category: "Security & Backend Validation",
    query: "Apa yang terjadi jika user menebak Task ID milik project lain?",
    expectedKeywords: ["tidak boleh mendapatkan data", "relasi task"],
  },
  {
    category: "Security & Backend Validation",
    query: "Apa yang terjadi jika user mencoba edit task Done lewat API langsung?",
    expectedKeywords: ["menolak update"],
  },

  // ---------- 12. Project Membership & Invite Code ----------
  {
    category: "Membership & Invite Code",
    query: "Bagaimana cara user bergabung ke project?",
    expectedKeywords: ["invite code"],
  },
  {
    category: "Membership & Invite Code",
    query: "Siapa yang bisa menghapus member dari project?",
    expectedKeywords: ["Owner"],
  },

  // ---------- 13. Edge Cases ----------
  {
    category: "Edge Cases",
    query: "Apa yang terjadi jika assignee bukan member project?",
    expectedKeywords: ["Assignment ditolak"],
  },
  {
    category: "Edge Cases",
    query: "Apa yang terjadi jika due date sebuah task terlewati?",
    expectedKeywords: ["overdue", "tetap ada"],
  },
  {
    category: "Edge Cases",
    query: "Bagaimana sistem mencegah double submit saat request to done?",
    expectedKeywords: ["loading", "disable"],
  },

  // ---------- 14. FAQ direct-match sanity check ----------
  {
    category: "FAQ Direct Match",
    query: "Apakah assignee harus member project?",
    expectedKeywords: ["Ya"],
  },
  {
    category: "FAQ Direct Match",
    query: "Apakah user luar project dapat melihat task?",
    expectedKeywords: ["Tidak"],
  },

  // ---------- 15. CROSS-DOCUMENT PRECISION (doc 21 vs doc 23) ----------
  // Both documents discuss task management, status lifecycle, and
  // Request to Done/Close — the highest-risk area for the reranker to
  // blend or confuse content from the two different documents.
  {
    category: "Cross-document — doc21 vs doc23",
    query: "Apakah task management ini punya fitur Request to Close?",
    note: "Request to Close (dengan approval khusus Project Owner, email notification) HANYA ada di doc 21 (Task_Management_Workflow_Portofolio). Doc 23 (knowledge base) TIDAK membahas Request to Close sama sekali — hanya Request to Done. Cek manual: apakah top result salah mencampur konsep dari 2 dokumen berbeda?",
  },
  {
    category: "Cross-document — doc21 vs doc23",
    query: "Apa itu isLocked pada task?",
    note: "isLocked, doneRequestStatus, closeRequestStatus adalah istilah TEKNIS spesifik dari doc 21 (Task_Management_Workflow_Portofolio — dokumen portfolio project Tara). Doc 23 adalah knowledge base umum yang TIDAK memakai istilah field database ini. Pastikan top result berasal dari doc 21, bukan tercampur.",
  },
  {
    category: "Cross-document — doc21 vs doc23",
    query: "Siapa yang boleh approve Request to Done?",
    note: "Doc 21 bilang 'Project Owner atau Reviewer'. Doc 23 bilang 'Owner atau Admin'. INI BEDA — cek manual jawaban mana yang muncul, dan apakah top result mencampur kedua sumber jadi satu jawaban yang salah/kontradiktif.",
  },
  {
    category: "Cross-document — doc21 vs doc23",
    query: "Apa saja role yang tersedia di sistem task management?",
    note: "Doc 23 punya definisi role lengkap (Owner, Admin, Member, Viewer). Doc 21 TIDAK punya section role sedetail ini. Idealnya top result dari doc 23.",
  },
  {
    category: "Cross-document — doc21 vs doc23",
    query: "Apa itu Kanban Board pada task management?",
    note: "Kanban Board HANYA dijelaskan di doc 23. Doc 21 tidak menyebut Kanban sama sekali. Top result harus dari doc 23.",
  },

  // ---------- 16. Distractor vs CV documents (doc 20) ----------
  {
    category: "Distractor — vs CV (doc 20)",
    query: "Apakah task management pakai Django?",
    note: "Django ada di project System Web Ticketing (CV lama, doc 20) — TIDAK ADA di doc 21 atau doc 23. Cek manual apakah top result keliru menarik dari doc 20.",
  },

  // ---------- 17. Genuinely out of scope ----------
  {
    category: "Out of scope",
    query: "Berapa harga langganan aplikasi task management ini?",
    expectOutOfScope: true,
  },
  {
    category: "Out of scope",
    query: "Bahasa pemrograman apa yang dipakai membuat knowledge base ini?",
    expectOutOfScope: true,
  },
];

// ---------- runner (same evaluation logic as test-task-management-coverage.mjs) ----------

function truncate(str, len = 160) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len).trim() + "…" : str;
}

async function runQuestion(q) {
  let data;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q.query }),
    });
    data = await res.json();
  } catch (err) {
    return { q, error: err.message };
  }
  return { q, data };
}

function evaluate(q, data) {
  if (!data || !data.success) {
    return { verdict: "⚠️ ERROR", detail: "request failed or success=false" };
  }

  const top = (data.results || [])[0];

  if (q.expectOutOfScope) {
    if (data.isOutOfScope) {
      return { verdict: "✅", detail: "correctly flagged out-of-scope" };
    }
    return {
      verdict: "❌",
      detail: `expected out-of-scope, but got isOutOfScope=${data.isOutOfScope}, top="${top?.section}" (doc ${top?.document_id})`,
    };
  }

  if (data.isOutOfScope) {
    return {
      verdict: "❌",
      detail: `unexpectedly flagged out-of-scope (fallbackWarning: ${data.fallbackWarning})`,
    };
  }

  if (!top) {
    return { verdict: "❌", detail: "no results returned" };
  }

  if (q.expectedKeywords && q.expectedKeywords.length > 0) {
    const normalize = (s) => (s || "").toLowerCase().replace(/\s+/g, "");
    const haystack = normalize(top.content);
    const missing = q.expectedKeywords.filter(
      (kw) => !haystack.includes(normalize(kw))
    );
    if (missing.length === 0) {
      return { verdict: "✅", detail: null };
    }
    return {
      verdict: "🟡",
      detail: `top result missing expected keyword(s): ${missing.join(", ")} — REVIEW MANUALLY`,
    };
  }

  return { verdict: "🔍", detail: "no auto-check defined — review manually" };
}

async function main() {
  const filtered = categoryFilter
    ? questions.filter((q) => q.category.toLowerCase().includes(categoryFilter))
    : questions;

  console.log(`\nRunning ${filtered.length} coverage questions against ${ENDPOINT}\n`);

  let lastCategory = null;
  const summary = { "✅": 0, "🟡": 0, "❌": 0, "🔍": 0, "⚠️ ERROR": 0 };

  for (const q of filtered) {
    if (q.category !== lastCategory) {
      console.log(`\n=== ${q.category} ===`);
      lastCategory = q.category;
    }

    const { data, error } = await runQuestion(q);
    if (error) {
      console.log(`⚠️ ERROR  "${q.query}"`);
      console.log(`   request failed: ${error}\n`);
      summary["⚠️ ERROR"]++;
      continue;
    }

    const { verdict, detail } = evaluate(q, data);
    summary[verdict] = (summary[verdict] || 0) + 1;

    const top = (data.results || [])[0];
    console.log(`${verdict}  "${q.query}"`);
    if (data.isOutOfScope) {
      console.log(`   → isOutOfScope: true | ${data.fallbackWarning || ""}`);
    } else if (top) {
      console.log(
        `   → top: [${top.id}] doc:${top.document_id} "${top.section}" | finalScore: ${top.debugScore?.finalScore ?? "n/a"} | reason: ${top.retrievalReason}`
      );
      console.log(`   → preview: "${truncate(top.content)}"`);
    }
    if (detail) console.log(`   ⤷ ${detail}`);
    if (q.note) console.log(`   📝 note: ${q.note}`);
    console.log("");
  }

  console.log("─".repeat(60));
  console.log("Summary:");
  console.log(`  ✅ looks correct       : ${summary["✅"] || 0}`);
  console.log(`  🟡 review manually      : ${summary["🟡"] || 0}`);
  console.log(`  🔍 no auto-check        : ${summary["🔍"] || 0}`);
  console.log(`  ❌ likely wrong         : ${summary["❌"] || 0}`);
  console.log(`  ⚠️  request errors      : ${summary["⚠️ ERROR"] || 0}`);
  console.log("─".repeat(60));
  console.log(
    "\nPay special attention to the 'Cross-document' category — that's where\n" +
    "doc 21 and doc 23 content is most likely to get blended or confused,\n" +
    "since both documents discuss task/status/approval terminology.\n" +
    "\nOnce a query looks right, promote it into test-vector-search.mjs as a\n" +
    "strict regression test (topResultId, minTopScore)."
  );
}

main();
