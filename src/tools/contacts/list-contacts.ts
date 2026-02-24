import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridListResponse, PostGridContact } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_list_contacts",
  description: "List or search PostGrid contacts. Supports pagination with skip/limit.",
  schema: {
    search: z.string().optional().describe("Search by name or company"),
    skip: z.number().optional().describe("Number of records to skip (default: 0)"),
    limit: z.number().optional().describe("Maximum records to return (default: 10, max: 100)"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const result = await printClient.get<PostGridListResponse<PostGridContact>>("/contacts", {
        search: args.search as string | undefined,
        skip: (args.skip as number | undefined) ?? 0,
        limit: Math.min((args.limit as number | undefined) ?? 10, 100),
      });

      const mode = printClient.getModePrefix();
      const lines = result.data.map((c) => {
        const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.companyName || "Unknown";
        const addr = [c.city, c.provinceOrState].filter(Boolean).join(", ");
        return `  ${c.id} | ${name} | ${addr}`;
      });

      const header = `${mode} Contacts (${result.skip + 1}-${result.skip + result.data.length} of ${result.totalCount})`;
      const table = lines.length > 0 ? lines.join("\n") : "  No contacts found.";
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
