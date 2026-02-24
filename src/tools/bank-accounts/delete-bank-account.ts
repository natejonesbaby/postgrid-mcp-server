import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_delete_bank_account",
  description: "Delete a bank account. This cannot be undone. Checks already created using this account are not affected.",
  schema: {
    id: z.string().describe("Bank account ID to delete"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      await printClient.delete(`/bank_accounts/${args.id}`);
      const mode = printClient.getModePrefix();
      return {
        content: [{ type: "text" as const, text: `${mode} Bank account ${args.id} deleted.` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
