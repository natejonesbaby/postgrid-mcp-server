import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridContact } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_update_contact",
  description: "Update an existing PostGrid contact. Only provided fields will be updated.",
  schema: {
    id: z.string().describe("Contact ID to update"),
    firstName: z.string().optional().describe("Updated first name"),
    lastName: z.string().optional().describe("Updated last name"),
    companyName: z.string().optional().describe("Updated company name"),
    addressLine1: z.string().optional().describe("Updated street address line 1"),
    addressLine2: z.string().optional().describe("Updated address line 2"),
    city: z.string().optional().describe("Updated city"),
    provinceOrState: z.string().optional().describe("Updated state/province"),
    postalOrZip: z.string().optional().describe("Updated ZIP/postal code"),
    countryCode: z.string().optional().describe("Updated country code"),
    email: z.string().optional().describe("Updated email"),
    phoneNumber: z.string().optional().describe("Updated phone"),
    description: z.string().optional().describe("Updated description"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const { id, ...updates } = args;
      // Remove undefined values
      const body = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));

      const contact = await printClient.post<PostGridContact>(`/contacts/${id}`, body);
      const mode = printClient.getModePrefix();
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.companyName || "Unknown";

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Contact updated: ${name} (${contact.id})`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
