import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridListResponse, PostGridBankAccount } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_list_bank_accounts",
  description: "List bank accounts. Account and routing numbers are masked.",
  schema: {
    skip: z.number().optional().describe("Records to skip (default: 0)"),
    limit: z.number().optional().describe("Max records (default: 10, max: 100)"),
  },
  handler: async (args: any) => {
    try {
      const result = await printClient.get<PostGridListResponse<PostGridBankAccount>>("/bank_accounts", {
        skip: args.skip ?? 0,
        limit: Math.min(args.limit ?? 10, 100),
      });

      const mode = printClient.getModePrefix();
      const lines = result.data.map((a) =>
        `  ${a.id} | ${a.bankName} | ${a.bankCountryCode}`
      );

      const header = `${mode} Bank Accounts (${result.skip + 1}-${result.skip + result.data.length} of ${result.totalCount})`;
      const table = lines.length > 0 ? lines.join("\n") : "  No bank accounts found.";

      return {
        content: [{ type: "text" as const, text: `${header}\n\n${table}` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
