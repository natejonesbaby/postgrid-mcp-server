import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_delete_template",
  description: "Delete a template. This cannot be undone.",
  schema: {
    id: z.string().describe("Template ID to delete"),
  },
  handler: async (args: any) => {
    try {
      await printClient.delete(`/templates/${args.id}`);
      const mode = printClient.getModePrefix();
      return {
        content: [{ type: "text" as const, text: `${mode} Template ${args.id} deleted.` }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
