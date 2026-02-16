import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridTemplate } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_get_template",
  description: "Get a template by ID, including its HTML content.",
  schema: {
    id: z.string().describe("Template ID (e.g., 'template_xxx')"),
  },
  handler: async (args: any) => {
    try {
      const template = await printClient.get<PostGridTemplate>(`/templates/${args.id}`);
      const mode = printClient.getModePrefix();

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Template: ${template.id}\n\nDescription: ${template.description || "N/A"}\nCreated: ${template.createdAt}\n\nHTML Content:\n${template.html || "(empty)"}`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
