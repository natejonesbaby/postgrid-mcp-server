import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridListResponse, PostGridTemplate } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_list_templates",
  description: "List templates with optional search and pagination.",
  schema: {
    search: z.string().optional().describe("Search filter"),
    skip: z.number().optional().describe("Records to skip (default: 0)"),
    limit: z.number().optional().describe("Max records (default: 10, max: 100)"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const result = await printClient.get<PostGridListResponse<PostGridTemplate>>("/templates", {
        search: args.search as string | undefined,
        skip: (args.skip as number | undefined) ?? 0,
        limit: Math.min((args.limit as number | undefined) ?? 10, 100),
      });

      const mode = printClient.getModePrefix();
      const lines = result.data.map((t) =>
        `  ${t.id} | ${t.description || "(no description)"} | ${t.createdAt.split("T")[0]}`
      );

      const header = `${mode} Templates (${result.skip + 1}-${result.skip + result.data.length} of ${result.totalCount})`;
      const table = lines.length > 0 ? lines.join("\n") : "  No templates found.";

      return {
        content: [{ type: "text" as const, text: `${header}\n\n${table}` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
