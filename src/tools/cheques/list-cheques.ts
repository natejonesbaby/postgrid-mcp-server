import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { centsToDollars } from "../../helpers/format-money.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridListResponse, PostGridCheque } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_list_cheques",
  description: "List checks with optional search and pagination.",
  schema: {
    search: z.string().optional().describe("Search filter"),
    skip: z.number().optional().describe("Records to skip (default: 0)"),
    limit: z.number().optional().describe("Max records (default: 10, max: 100)"),
  },
  handler: async (args: any) => {
    try {
      const result = await printClient.get<PostGridListResponse<PostGridCheque>>("/cheques", {
        search: args.search,
        skip: args.skip ?? 0,
        limit: Math.min(args.limit ?? 10, 100),
      });

      const mode = printClient.getModePrefix();
      const lines = result.data.map((c) => {
        const to = typeof c.to === "object"
          ? [c.to.firstName, c.to.lastName].filter(Boolean).join(" ") || c.to.companyName || "N/A"
          : c.to;
        return `  ${c.id} | ${c.status.padEnd(12)} | ${to} | ${centsToDollars(c.amount)}`;
      });

      const header = `${mode} Cheques (${result.skip + 1}-${result.skip + result.data.length} of ${result.totalCount})`;
      const table = lines.length > 0 ? lines.join("\n") : "  No cheques found.";
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
