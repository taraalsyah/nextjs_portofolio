import prisma from "../src/lib/prisma";
import { handleAuthorizedToolCall } from "../src/services/mcp/authorized-tools";

async function testAiIntentTools() {
  try {
    console.log("=== 1. Testing 'search_projects' Tool for Authorized User 1 ===");
    const searchProjectsRes = await handleAuthorizedToolCall("search_projects", { keyword: "a" }, 1);
    console.log("search_projects User 1 result snippet:\n", searchProjectsRes.substring(0, 300) + "...");

    console.log("\n=== 2. Testing 'count_project_tasks' Tool for Authorized User 1 (Project 1) ===");
    const countRes = await handleAuthorizedToolCall("count_project_tasks", { project_id: 1, status: "DONE" }, 1);
    console.log("count_project_tasks User 1 (Project 1, DONE) result:\n", countRes);

    console.log("\n=== 3. Testing 'count_project_tasks' Tool for Unauthorized User 999999 ===");
    const unauthCountRes = await handleAuthorizedToolCall("count_project_tasks", { project_id: 1, status: "DONE" }, 999999);
    console.log("count_project_tasks Unauthorized result:\n", unauthCountRes);

    console.log("\n=== 4. Testing 'search_projects' Tool for Unauthorized User 999999 ===");
    const unauthSearchRes = await handleAuthorizedToolCall("search_projects", { keyword: "a" }, 999999);
    console.log("search_projects Unauthorized result:\n", unauthSearchRes);

    console.log("\n=== All Intent & Tool Tests Executed Successfully! ===");
  } finally {
    await prisma.$disconnect();
  }
}

testAiIntentTools().catch((err) => {
  console.error(err);
  process.exit(1);
});
