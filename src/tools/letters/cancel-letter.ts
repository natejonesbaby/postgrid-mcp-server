import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_cancel_letter",
  description: "Cancel a letter. Only works when the letter status is 'ready' (before it enters printing).",
  schema: {
    id: z.string().describe("Letter ID to cancel"),
  },
  handler: async (args: any) => {
    try {
      await printClient.post(`/letters/${args.id}/cancel`, {});
      const mode = printClient.getModePrefix();
      return {
        content: [{ type: "text" as const, text: `${mode} Letter ${args.id} cancelled.` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
