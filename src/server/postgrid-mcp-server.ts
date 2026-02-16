import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class PostGridMCPServer {
  private static instance: McpServer | null = null;

  private constructor() {}

  public static GetServer(): McpServer {
    if (PostGridMCPServer.instance === null) {
      PostGridMCPServer.instance = new McpServer({
        name: "PostGrid MCP Server",
        version: "1.0.0",
      });
    }
    return PostGridMCPServer.instance;
  }
}
