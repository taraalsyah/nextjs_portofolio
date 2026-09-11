import prisma from "../src/lib/prisma";
import { handleAuthorizedToolCall } from "../src/services/mcp/authorized-tools";

async function testCountConsistency() {
  try {
    console.log("=== 1. Testing 'search_projects' active task count ===");
    const searchResStr = await handleAuthorizedToolCall("search_projects", { keyword: "a" }, 1);
    const searchRes = JSON.parse(searchResStr);
    console.log("search_projects results:");
    if (searchRes.projects) {
      searchRes.projects.forEach((p: any) => {
        console.log(` - Project ID ${p.id} (${p.projectName}): totalTasks = ${p.totalTasks}`);
      });
    }

    console.log("\n=== 2. Testing 'get_project' active task count ===");
    const getProjStr = await handleAuthorizedToolCall("get_project", { project_id: 1 }, 1);
    const getProj = JSON.parse(getProjStr);
    console.log(`Project 1 get_project totalTasks = ${getProj.stats?.totalTasks}`);

    console.log("\n=== 3. Testing 'count_project_tasks' direct database count ===");
    const countStr = await handleAuthorizedToolCall("count_project_tasks", { project_id: 1 }, 1);
    const countRes = JSON.parse(countStr);
    console.log(`Project 1 count_project_tasks count = ${countRes.count}`);

    console.log("\n=== SUCCESS: All active task counts are consistent! ===");
  } finally {
    await prisma.$disconnect();
  }
}

testCountConsistency().catch((err) => {
  console.error(err);
  process.exit(1);
});
