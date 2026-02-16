import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolDefinition } from "../types/tool-definition.js";

export function RegisterTool(
  server: McpServer,
  toolDefinition: ToolDefinition
) {
  server.tool(
    toolDefinition.name,
    toolDefinition.description,
    toolDefinition.schema,
    toolDefinition.handler
  );
}
