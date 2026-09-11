import { handleDirectToolCall, MCP_TOOLS_LIST } from "../src/services/mcp/server";

async function runMcpTests() {
  console.log("=== 1. Testing MCP Tools List ===");
  console.log(`Available tools count: ${MCP_TOOLS_LIST.length}`);
  MCP_TOOLS_LIST.forEach((tool) => {
    console.log(` - Tool: ${tool.name}: ${tool.description}`);
  });

  console.log("\n=== 2. Testing 'search_tasks' Tool ===");
  try {
    const searchResult = await handleDirectToolCall("search_tasks", { keyword: "a" });
    console.log("search_tasks result sample:");
    console.log(searchResult.substring(0, 300) + "...");
  } catch (err: any) {
    console.error("search_tasks error:", err.message);
  }

  console.log("\n=== 3. Testing 'get_task' Tool (Non-existent task) ===");
  try {
    const getTaskResult = await handleDirectToolCall("get_task", { task_id: "NON_EXISTENT_99999" });
    console.log("get_task non-existent result:", getTaskResult);
  } catch (err: any) {
    console.error("get_task non-existent error:", err.message);
  }

  console.log("\n=== 4. Testing 'get_project' Tool ===");
  try {
    const getProjectResult = await handleDirectToolCall("get_project", { project_id: 1 });
    console.log("get_project result:");
    console.log(getProjectResult.substring(0, 300) + "...");
  } catch (err: any) {
    console.error("get_project error:", err.message);
  }

  console.log("\n=== 5. Testing 'get_project_tasks' Tool ===");
  try {
    const getProjectTasksResult = await handleDirectToolCall("get_project_tasks", { project_id: 1, limit: 5 });
    console.log("get_project_tasks result:");
    console.log(getProjectTasksResult.substring(0, 300) + "...");
  } catch (err: any) {
    console.error("get_project_tasks error:", err.message);
  }
}

runMcpTests().catch(console.error);
