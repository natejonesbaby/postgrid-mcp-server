import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridListResponse, PostGridLetter } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_list_letters",
  description: "List letters with optional search and pagination.",
  schema: {
    search: z.string().optional().describe("Search filter"),
    skip: z.number().optional().describe("Number of records to skip (default: 0)"),
    limit: z.number().optional().describe("Max records to return (default: 10, max: 100)"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const result = await printClient.get<PostGridListResponse<PostGridLetter>>("/letters", {
        search: args.search as string | undefined,
        skip: (args.skip as number | undefined) ?? 0,
        limit: Math.min((args.limit as number | undefined) ?? 10, 100),
      });

      const mode = printClient.getModePrefix();
      const lines = result.data.map((l) => {
        const to = typeof l.to === "object"
          ? [l.to.firstName, l.to.lastName].filter(Boolean).join(" ") || l.to.companyName || "N/A"
          : l.to;
        return `  ${l.id} | ${l.status.padEnd(12)} | ${to} | ${l.mailingClass || "standard"}`;
      });

      const header = `${mode} Letters (${result.skip + 1}-${result.skip + result.data.length} of ${result.totalCount})`;
      const table = lines.length > 0 ? lines.join("\n") : "  No letters found.";
      const pagination = result.totalCount > (result.skip + result.data.length)
        ? `\nUse skip=${result.skip + result.data.length} to see more.`
        : "";

      return {
        content: [{ type: "text" as const, text: `${header}\n\n${table}${pagination}` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
