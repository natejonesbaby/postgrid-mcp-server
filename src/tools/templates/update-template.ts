import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridTemplate } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_update_template",
  description: "Update an existing template's HTML content or description.",
  schema: {
    id: z.string().describe("Template ID to update"),
    html: z.string().optional().describe("Updated HTML content"),
    description: z.string().optional().describe("Updated description"),
  },
  handler: async (args: any) => {
    try {
      const body: Record<string, string> = {};
      if (args.html) body.html = args.html;
      if (args.description) body.description = args.description;

      const template = await printClient.post<PostGridTemplate>(`/templates/${args.id}`, body);
      const mode = printClient.getModePrefix();

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Template ${template.id} updated.`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
