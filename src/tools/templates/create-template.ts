import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridTemplate } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_create_template",
  description: "Create an HTML template with Handlebars merge variables (e.g., {{name}}, {{address}}). Templates can be reused across multiple letters.",
  schema: {
    html: z.string().describe("HTML content with optional {{mergeVariable}} placeholders"),
    description: z.string().optional().describe("Template description/name for easy identification"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const template = await printClient.post<PostGridTemplate>("/templates", {
        html: args.html,
        description: args.description,
      });

      const mode = printClient.getModePrefix();
      return {
        content: [{
          type: "text" as const,
          text: `${mode} Template created.\n\nID: ${template.id}\nDescription: ${template.description || "N/A"}\n\nUse this template ID when creating letters.`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
