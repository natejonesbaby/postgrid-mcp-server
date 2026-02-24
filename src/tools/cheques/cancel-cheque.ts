import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_cancel_cheque",
  description: "Cancel a check. Only works when the check status is 'ready' (before it enters printing).",
  schema: {
    id: z.string().describe("Cheque ID to cancel"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      await printClient.post(`/cheques/${args.id}/cancel`, {});
      const mode = printClient.getModePrefix();
      return {
        content: [{ type: "text" as const, text: `${mode} Cheque ${args.id} cancelled.` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
