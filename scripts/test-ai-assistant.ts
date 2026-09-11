import prisma from "../src/lib/prisma";
import { getUserAuthorizedProjectIds, isUserAuthorizedForProject } from "../src/services/mcp/authorization";
import { handleAuthorizedToolCall } from "../src/services/mcp/authorized-tools";

async function testAiAssistantAuthorization() {
  try {
    console.log("=== 1. Testing Authorized Project IDs for User 1 ===");
    const projectIdsUser1 = await getUserAuthorizedProjectIds(1);
    console.log("User 1 Authorized Project IDs:", projectIdsUser1);

    console.log("\n=== 2. Testing Authorization Check for Project 1 ===");
    const isAuthUser1Proj1 = await isUserAuthorizedForProject(1, 1);
    console.log("Is User 1 Authorized for Project 1?", isAuthUser1Proj1);

    console.log("\n=== 3. Testing Authorized 'search_tasks' for User 1 ===");
    const searchUser1 = await handleAuthorizedToolCall("search_tasks", { keyword: "a" }, 1);
    console.log("User 1 Search Result sample:\n", searchUser1.substring(0, 300) + "...");

    console.log("\n=== 4. Testing Unauthorized 'get_project' for Non-Existent/Unauthorized User ===");
    const unauthorizedUser999Result = await handleAuthorizedToolCall("get_project", { project_id: 1 }, 999999);
    console.log("User 999999 Project 1 Result:", unauthorizedUser999Result);

    console.log("\n=== 5. Testing Unauthorized 'get_project_tasks' for Unauthorized User ===");
    const unauthorizedTasksResult = await handleAuthorizedToolCall("get_project_tasks", { project_id: 1 }, 999999);
    console.log("User 999999 Project Tasks Result:", unauthorizedTasksResult);

    console.log("\n=== All Authorization Tests Passed Successfully! ===");
  } finally {
    await prisma.$disconnect();
  }
}

testAiAssistantAuthorization().catch(console.error);
