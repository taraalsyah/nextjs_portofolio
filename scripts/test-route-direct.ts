import { POST } from "../src/app/api/mcp/route";

async function testDirectRoute() {
  process.env.MCP_API_KEY = "mcp_sk_tasktuntas_9f8e7d6c5b4a3120";

  console.log("--- 1. Testing unauthorized call ---");
  const reqUnauthorized = new Request("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  const resUnauthorized = await POST(reqUnauthorized);
  console.log("Unauthorized Status:", resUnauthorized.status);
  console.log("Unauthorized Body:", await resUnauthorized.json());

  console.log("\n--- 2. Testing authorized tools/list call ---");
  const reqAuthorized = new Request("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer mcp_sk_tasktuntas_9f8e7d6c5b4a3120",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
  });
  const resAuthorized = await POST(reqAuthorized);
  console.log("Authorized Status:", resAuthorized.status);
  const dataList = await resAuthorized.json();
  console.log("Tools returned count:", dataList.result?.tools?.length);

  console.log("\n--- 3. Testing tools/call (search_tasks) ---");
  const reqSearch = new Request("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer mcp_sk_tasktuntas_9f8e7d6c5b4a3120",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "search_tasks", arguments: { keyword: "a" } },
    }),
  });
  const resSearch = await POST(reqSearch);
  console.log("Search Status:", resSearch.status);
  console.log("Search Response:", JSON.stringify(await resSearch.json(), null, 2).substring(0, 400) + "...");
}

testDirectRoute().catch(console.error);
