import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridContact } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_get_contact",
  description: "Get a PostGrid contact by ID. Returns contact details including name and address.",
  schema: {
    id: z.string().describe("Contact ID (e.g., 'contact_xxx')"),
  },
  handler: async (args: any) => {
    try {
      const contact = await printClient.get<PostGridContact>(`/contacts/${args.id}`);
      const mode = printClient.getModePrefix();
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.companyName || "Unknown";
      const address = [contact.addressLine1, contact.addressLine2, contact.city, contact.provinceOrState, contact.postalOrZip].filter(Boolean).join(", ");

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Contact: ${name}\n\nID: ${contact.id}\nAddress: ${address}\nEmail: ${contact.email || "N/A"}\nPhone: ${contact.phoneNumber || "N/A"}\nDescription: ${contact.description || "N/A"}`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
