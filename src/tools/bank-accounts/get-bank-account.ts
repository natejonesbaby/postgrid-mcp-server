import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridBankAccount } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_get_bank_account",
  description: "Get bank account details by ID. Account and routing numbers are masked for security.",
  schema: {
    id: z.string().describe("Bank account ID (e.g., 'bank_account_xxx')"),
  },
  handler: async (args: any) => {
    try {
      const account = await printClient.get<PostGridBankAccount>(`/bank_accounts/${args.id}`);
      const mode = printClient.getModePrefix();

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Bank Account: ${account.id}\n\nBank: ${account.bankName}\nCountry: ${account.bankCountryCode}\nDescription: ${account.description || "N/A"}\nCreated: ${account.createdAt}`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
