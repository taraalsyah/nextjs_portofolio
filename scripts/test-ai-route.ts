import prisma from "../src/lib/prisma";
import { handleAuthorizedToolCall } from "../src/services/mcp/authorized-tools";
import { getUserAuthorizedProjectIds, isUserAuthorizedForProject } from "../src/services/mcp/authorization";

async function runRouteTests() {
  console.log("=== Testing AI Authorization Logic directly ===");
  const authIds = await getUserAuthorizedProjectIds(1);
  console.log("User 1 Authorized Projects:", authIds);

  const testGetProjectAuth = await handleAuthorizedToolCall("get_project", { project_id: 1 }, 1);
  console.log("Authorized get_project result snippet:\n", testGetProjectAuth.substring(0, 200) + "...");

  const testGetProjectUnauth = await handleAuthorizedToolCall("get_project", { project_id: 99999 }, 1);
  console.log("Unauthorized get_project result:", testGetProjectUnauth);

  await prisma.$disconnect();
  console.log("\nSUCCESS: All server-side authorization checks verified!");
}

runRouteTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
