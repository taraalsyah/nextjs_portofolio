/**
 * Coverage checker for questions derived from
 * "Task_Management_Workflow_Portofolio.pdf"
 *
 * Unlike test-vector-search.mjs (strict pass/fail regression tests),
 * this script is a DISCOVERY tool: it runs a broad set of questions
 * covering every section of the document, prints the top result +
 * a content preview, and does a soft keyword check so you can quickly
 * eyeball whether the retrieval is on-topic before locking it in as
 * a formal regression test.
 *
 * Usage:
 *   node test-task-management-coverage.mjs
 *   node test-task-management-coverage.mjs --base-url http://127.0.0.1:3000
 *   node test-task-management-coverage.mjs --category "Dual-Approval"
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

/**
 * expectedKeywords: words/phrases that SHOULD appear in the top result's
 * content if retrieval is correct. Case-insensitive substring match.
 * expectOutOfScope: true if this question should NOT be answerable from
 * the document (used for distractor / negative-fact checks).
 */
const questions = [
  // ---------- 1. System Overview / Architecture ----------
  {
    category: "Overview & Architecture",
    query: "Arsitektur apa yang digunakan pada sistem task management?",
    expectedKeywords: ["App Router", "TypeScript", "Prisma"],
  },
  {
    category: "Overview & Architecture",
    query: "Database apa yang dipakai di task management?",
    expectedKeywords: ["MySQL"],
  },
  {
    category: "Overview & Architecture",
    query: "ORM apa yang digunakan di project task management?",
    expectedKeywords: ["Prisma"],
  },
  {
    category: "Overview & Architecture",
    query: "Apa tujuan utama dibangunnya sistem task management ini?",
    expectedKeywords: ["terstruktur", "transparan", "aman", "persetujuan"],
  },

  // ---------- 2. Status Lifecycle ----------
  {
    category: "Status Lifecycle",
    query: "Ada berapa status resmi task di sistem ini?",
    expectedKeywords: ["BACKLOG", "OPEN", "IN_PROGRESS", "DONE", "CLOSED"],
  },
  {
    category: "Status Lifecycle",
    query: "Apakah LOCKED itu status task tersendiri?",
    expectedKeywords: ["bukan", "kondisi proteksi", "isLocked"],
  },
  {
    category: "Status Lifecycle",
    query: "Task dengan status apa yang masih bisa diedit bebas?",
    expectedKeywords: ["OPEN", "editable"],
  },
  {
    category: "Status Lifecycle",
    query: "Apa yang bisa dilakukan assignee saat task berstatus IN_PROGRESS?",
    expectedKeywords: ["Request to Done", "Request to Close"],
  },
  {
    category: "Status Lifecycle",
    query: "Jika task sudah CLOSED, apakah masih bisa diubah?",
    expectedKeywords: ["terkunci penuh", "tidak dapat diubah"],
  },
  {
    category: "Status Lifecycle",
    query: "Jika task sudah DONE, apakah masih bisa diedit?",
    expectedKeywords: ["Read-Only", "isLocked"],
  },

  // ---------- 3. Dual-Approval Workflow: Request to Done ----------
  {
    category: "Dual-Approval — Request to Done",
    query: "Bagaimana cara assignee menandai task selesai?",
    expectedKeywords: ["request-done", "PENDING", "doneRequestStatus"],
  },
  {
    category: "Dual-Approval — Request to Done",
    query: "Apa yang terjadi jika Request to Done ditolak?",
    expectedKeywords: ["IN_PROGRESS", "REJECTED", "perbaikan"],
  },
  {
    category: "Dual-Approval — Request to Done",
    query: "Siapa yang bisa menyetujui Request to Done?",
    expectedKeywords: ["Project Owner", "Reviewer"],
  },
  {
    category: "Dual-Approval — Request to Done",
    query: "Apakah assignee bisa langsung mengubah status task menjadi DONE sendiri?",
    expectedKeywords: ["tidak dapat secara sepihak"],
  },

  // ---------- 4. Dual-Approval Workflow: Request to Close ----------
  {
    category: "Dual-Approval — Request to Close",
    query: "Dari status apa saja task bisa diajukan Request to Close?",
    expectedKeywords: ["IN_PROGRESS", "DONE"],
  },
  {
    category: "Dual-Approval — Request to Close",
    query: "Siapa satu-satunya yang boleh approve Request to Close?",
    expectedKeywords: ["Project Owner", "langsung"],
  },
  {
    category: "Dual-Approval — Request to Close",
    query: "Apa yang terjadi jika Owner menolak Request to Close?",
    expectedKeywords: ["dikembalikan", "REJECTED"],
  },
  {
    category: "Dual-Approval — Request to Close",
    query: "Apa perbedaan Request to Done dan Request to Close?",
    expectedKeywords: ["Request to Done", "Request to Close"],
  },

  // ---------- 5. Email Notification ----------
  {
    category: "Email Notification",
    query: "Siapa yang menerima email saat Request to Close diajukan?",
    expectedKeywords: ["Project Owner", "sendTaskCloseNotification"],
  },
  {
    category: "Email Notification",
    query: "Apakah assignee lain ikut menerima email notifikasi Request to Close?",
    expectOutOfScope: false,
    expectedKeywords: ["melarang keras", "requester, creator, assignee lain"],
  },

  // ---------- 6. Security & Authorization ----------
  {
    category: "Security & Authorization",
    query: "Di mana otorisasi dan validasi keamanan dilakukan, frontend atau backend?",
    expectedKeywords: ["Server", "Backend"],
  },
  {
    category: "Security & Authorization",
    query: "Apakah menyembunyikan tombol Edit di frontend cukup untuk keamanan?",
    expectedKeywords: ["BUKAN sebagai benteng keamanan", "UX"],
  },
  {
    category: "Security & Authorization",
    query: "Apa saja lapisan verifikasi yang dilalui setiap permintaan mutasi data?",
    expectedKeywords: ["Authentication Session", "Role & Workflow Permission"],
  },
  {
    category: "Security & Authorization",
    query: "Apa yang terjadi jika mencoba edit task yang sudah locked?",
    expectedKeywords: ["403 Forbidden", "getTaskLockedResponse"],
  },

  // ---------- 7. Auto-Numbering, Audit Trail, UI/UX ----------
  {
    category: "Auto-Numbering & Audit",
    query: "Bagaimana format penomoran otomatis task?",
    expectedKeywords: ["TSK-000001", "generateNextTaskNumber"],
  },
  {
    category: "Auto-Numbering & Audit",
    query: "Apa yang dicatat dalam audit trail?",
    expectedKeywords: ["logTaskActivity", "sebelum dan sesudah"],
  },
  {
    category: "Auto-Numbering & Audit",
    query: "Apa itu zero layout shift di komponen tabel task?",
    expectedKeywords: ["isLoading", "isFetching", "flicker"],
  },

  // ---------- 8. Cross-document distractors (should NOT pull from this doc) ----------
  {
    category: "Distractor — cross document",
    query: "Apakah task management ini menggunakan Django?",
    expectOutOfScope: false,
    note: "Django ada di project System Web Ticketing (CV lama, doc 20), BUKAN di Task Management (doc 21). Cek manual apakah top result salah tarik dari doc 21.",
  },
  {
    category: "Distractor — cross document",
    query: "Apakah task management punya notifikasi Telegram?",
    note: "Telegram ada di project Email & Telegram Notification (CV lama, doc 20), BUKAN di Task Management. Cek manual.",
  },

  // ---------- 9. Genuinely out-of-scope (not in either document) ----------
  {
    category: "Out of scope",
    query: "Berapa lama waktu pengerjaan project task management ini?",
    expectOutOfScope: true,
  },
  {
    category: "Out of scope",
    query: "Apakah task management ini sudah deployed ke production?",
    expectOutOfScope: true,
  },
];

// ---------- runner ----------

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
      detail: `expected out-of-scope, but got isOutOfScope=${data.isOutOfScope}, top="${top?.section}"`,
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
    const haystack = (top.content || "").toLowerCase();
    const missing = q.expectedKeywords.filter(
      (kw) => !haystack.includes(kw.toLowerCase())
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
        `   → top: [${top.id}] "${top.section}" | finalScore: ${top.debugScore?.finalScore ?? "n/a"} | reason: ${top.retrievalReason}`
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
    "\nTip: once you've eyeballed a query and confirmed the top result id/score,\n" +
    "move it into test-vector-search.mjs as a strict regression test (topResultId, minTopScore)."
  );
}

main();
