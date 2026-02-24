import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_delete_contact",
  description: "Delete a PostGrid contact. This action cannot be undone.",
  schema: {
    id: z.string().describe("Contact ID to delete"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      await printClient.delete(`/contacts/${args.id}`);
      const mode = printClient.getModePrefix();
      return {
        content: [{ type: "text" as const, text: `${mode} Contact ${args.id} deleted.` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
