/**
 * Automated test suite for /api/test-vector-search
 *
 * Usage:
 *   node test-vector-search.mjs
 *   node test-vector-search.mjs --base-url http://localhost:3000
 *
 * Requires Node 18+ (built-in fetch). No extra dependencies.
 */

const BASE_URL =
  process.argv.includes("--base-url")
    ? process.argv[process.argv.indexOf("--base-url") + 1]
    : "http://localhost:3000";

const ENDPOINT = `${BASE_URL}/api/test-vector-search`;

/**
 * Each test case describes a query and the behavior we expect.
 * All "expect" fields are optional — only the ones you provide get checked.
 *
 *   expect.isOutOfScope       boolean
 *   expect.lowConfidence      boolean
 *   expect.isFallback         boolean
 *   expect.topResultId        string  -> results[0].id must equal this
 *   expect.topResultIncludes  string  -> results[0].section must include this (case-insensitive)
 *   expect.minTopScore        number  -> results[0].debugScore.finalScore must be >= this
 *   expect.maxTopScore        number  -> results[0].debugScore.finalScore must be <= this
 *   expect.resultIds          string[] -> results[].id must match this array (order-sensitive)
 *   expect.rejectedIncludes   string[] -> rejectedCandidates[].id must include all of these
 *   expect.minResultsCount    number
 */
const testCases = [
  {
    name: "List query — projects (Bahasa Indonesia, multi-document)",
    query: "Apa saja project yang pernah dikerjakan Tara??",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
      minTopScore: 0.6,
      minResultsCount: 4,
      // Github link and near-empty "Project 0: 20" placeholder chunk must
      // never appear in a project list — regression guard from the
      // multi-document ranking bugs found on 2026-08-09.
      rejectedIncludes: ["79", "86", "94"],
    },
  },
  {
    name: "Specific technical topic — SMSC experience",
    query: "Bagaimana pengalaman Tara dengan SMSC?",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
      topResultId: "83",
      topResultIncludes: "SMSC",
      minTopScore: 0.45,
    },
  },
  {
    name: "Direct factual question — education",
    query: "Di mana Tara kuliah??",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
      topResultId: "80",
      minTopScore: 0.5,
    },
  },
  {
    name: "Out-of-scope query — favorite color",
    query: "Apa warna favorit Tara??",
    expect: {
      isOutOfScope: true,
      lowConfidence: true,
      isFallback: true,
    },
  },
  {
    name: "Out-of-scope query — unrelated random topic",
    query: "Bagaimana cara membuat rendang yang enak?",
    expect: {
      isOutOfScope: true,
      lowConfidence: true,
    },
  },
  {
    name: "Ambiguous / minimal-context short query",
    query: "SMSC",
    expect: {
      isOutOfScope: false,
      minResultsCount: 1,
    },
  },
  {
    name: "Rephrased list-query intent (no literal 'apa saja')",
    query: "Ceritain dong project-project yang pernah dikerjakan Tara",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
      minResultsCount: 2,
    },
  },
  {
    name: "English phrasing — should still detect project intent",
    query: "What projects has Tara worked on?",
    expect: {
      isOutOfScope: false,
      minResultsCount: 1,
    },
  },
  {
    name: "Skills query",
    query: "Apa saja skill teknis yang dimiliki Tara?",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
    },
  },
  {
    name: "Empty / nonsense query — should not crash",
    query: "asdkjasdkj 12312 ???",
    expect: {
      isOutOfScope: true,
    },
  },
  {
    name: "Generic verb false-positive — cooking question w/ 'membuat'",
    query: "Bagaimana cara membuat rendang yang enak?",
    expect: {
      isOutOfScope: true,
      lowConfidence: true,
    },
  },
  {
    name: "New document topic — task management (must NOT be flagged out-of-scope)",
    query: "Bagaimana task management?",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
      minResultsCount: 1,
    },
  },
  {
    name: "Specific architecture question — precision ranking regression test",
    query: "arsitektur yang di gunakan task management?",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
      topResultId: "88",
      topResultIncludes: "arsitektur",
      minTopScore: 0.6,
    },
  },
  {
    name: "Task status count — precision ranking (structural formula fix)",
    query: "berapa status di task management?",
    expect: {
      isOutOfScope: false,
      lowConfidence: false,
      topResultId: "88",
      topResultIncludes: "status",
      minTopScore: 0.65,
    },
  },
];

// ---------- test runner ----------

function checkExpectation(name, actual, expected, label) {
  const pass = actual === expected;
  return {
    label,
    pass,
    detail: pass ? null : `expected ${label}=${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  };
}

async function runTest(testCase) {
  const { name, query, expect: exp } = testCase;
  const checks = [];

  let data;
  let httpOk = true;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    httpOk = res.ok;
    data = await res.json();
  } catch (err) {
    return {
      name,
      query,
      passed: false,
      checks: [{ label: "request", pass: false, detail: `request failed: ${err.message}` }],
    };
  }

  if (!httpOk || !data.success) {
    checks.push({
      label: "http/success",
      pass: false,
      detail: `HTTP not ok or success=false. Response: ${JSON.stringify(data).slice(0, 300)}`,
    });
    return { name, query, passed: false, checks };
  }

  const results = data.results || [];
  const top = results[0];

  if (exp.isOutOfScope !== undefined) {
    checks.push(checkExpectation(name, data.isOutOfScope, exp.isOutOfScope, "isOutOfScope"));
  }
  if (exp.lowConfidence !== undefined) {
    checks.push(checkExpectation(name, data.low_confidence, exp.lowConfidence, "low_confidence"));
  }
  if (exp.isFallback !== undefined) {
    checks.push(checkExpectation(name, data.isFallback, exp.isFallback, "isFallback"));
  }
  if (exp.topResultId !== undefined) {
    checks.push(checkExpectation(name, top?.id, exp.topResultId, "results[0].id"));
  }
  if (exp.topResultIncludes !== undefined) {
    const sectionText = (top?.section || "") + " " + (top?.content || "");
    const pass = sectionText.toLowerCase().includes(exp.topResultIncludes.toLowerCase());
    checks.push({
      label: "results[0] contains",
      pass,
      detail: pass ? null : `expected top result to mention "${exp.topResultIncludes}", got section="${top?.section}"`,
    });
  }
  if (exp.minTopScore !== undefined) {
    const score = top?.debugScore?.finalScore ?? -1;
    const pass = score >= exp.minTopScore;
    checks.push({
      label: "minTopScore",
      pass,
      detail: pass ? null : `expected finalScore >= ${exp.minTopScore}, got ${score}`,
    });
  }
  if (exp.maxTopScore !== undefined) {
    const score = top?.debugScore?.finalScore ?? 999;
    const pass = score <= exp.maxTopScore;
    checks.push({
      label: "maxTopScore",
      pass,
      detail: pass ? null : `expected finalScore <= ${exp.maxTopScore}, got ${score}`,
    });
  }
  if (exp.resultIds !== undefined) {
    const actualIds = results.map((r) => r.id);
    const pass = JSON.stringify(actualIds) === JSON.stringify(exp.resultIds);
    checks.push({
      label: "resultIds order",
      pass,
      detail: pass ? null : `expected ${JSON.stringify(exp.resultIds)}, got ${JSON.stringify(actualIds)}`,
    });
  }
  if (exp.rejectedIncludes !== undefined) {
    const rejectedIds = (data.rejectedCandidates || []).map((r) => r.id);
    const missing = exp.rejectedIncludes.filter((id) => !rejectedIds.includes(id));
    const pass = missing.length === 0;
    checks.push({
      label: "rejectedIncludes",
      pass,
      detail: pass ? null : `expected rejected to include ${JSON.stringify(missing)}, rejected was ${JSON.stringify(rejectedIds)}`,
    });
  }
  if (exp.minResultsCount !== undefined) {
    const pass = results.length >= exp.minResultsCount;
    checks.push({
      label: "minResultsCount",
      pass,
      detail: pass ? null : `expected at least ${exp.minResultsCount} results, got ${results.length}`,
    });
  }

  const passed = checks.every((c) => c.pass);
  return { name, query, passed, checks, raw: data };
}

async function main() {
  console.log(`\nRunning ${testCases.length} test cases against ${ENDPOINT}\n`);

  const results = [];
  for (const tc of testCases) {
    const result = await runTest(tc);
    results.push(result);

    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
    console.log(`   query: "${result.query}"`);
    for (const check of result.checks) {
      if (!check.pass) {
        console.log(`   ⤷ FAIL [${check.label}]: ${check.detail}`);
      }
    }
    console.log("");
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log("─".repeat(50));
  console.log(`Results: ${passedCount} passed, ${failedCount} failed (of ${results.length})`);
  console.log("─".repeat(50));

  if (failedCount > 0) {
    console.log("\nFailed tests:");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - ${r.name}`);
    }
    process.exitCode = 1;
  }
}

main();
