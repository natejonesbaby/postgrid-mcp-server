import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridLetter } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_get_letter",
  description: "Get a letter's details, status, and tracking information by ID.",
  schema: {
    id: z.string().describe("Letter ID (e.g., 'letter_xxx')"),
  },
  handler: async (args: any) => {
    try {
      const letter = await printClient.get<PostGridLetter>(`/letters/${args.id}`);
      const mode = printClient.getModePrefix();

      const toName = typeof letter.to === "object"
        ? [letter.to.firstName, letter.to.lastName].filter(Boolean).join(" ") || letter.to.companyName
        : letter.to;

      const lines = [
        `${mode} Letter: ${letter.id}`,
        "",
        `Status:   ${letter.status}`,
        `To:       ${toName || "N/A"}`,
        `Class:    ${letter.mailingClass || "N/A"}`,
        `Tracking: ${letter.trackingNumber || "Not yet available"}`,
        `Created:  ${letter.createdAt}`,
        letter.sendDate ? `Send Date: ${letter.sendDate}` : null,
        letter.url ? `PDF URL: ${letter.url}` : null,
      ].filter(Boolean);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
