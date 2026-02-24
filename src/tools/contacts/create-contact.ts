import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridContact } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_create_contact",
  description: "Create a contact in PostGrid with a mailing address. Contacts can be used as recipients or senders for letters and checks.",
  schema: {
    firstName: z.string().optional().describe("Contact first name"),
    lastName: z.string().optional().describe("Contact last name"),
    companyName: z.string().optional().describe("Company or organization name"),
    addressLine1: z.string().describe("Street address line 1"),
    addressLine2: z.string().optional().describe("Street address line 2 (apt, suite, etc.)"),
    city: z.string().optional().describe("City"),
    provinceOrState: z.string().optional().describe("State or province code (e.g., 'TN', 'CA')"),
    postalOrZip: z.string().optional().describe("ZIP or postal code"),
    countryCode: z.string().optional().describe("Two-letter country code (default: 'US')"),
    email: z.string().optional().describe("Email address"),
    phoneNumber: z.string().optional().describe("Phone number"),
    description: z.string().optional().describe("Internal description/notes"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const contact = await printClient.post<PostGridContact>("/contacts", {
        firstName: args.firstName,
        lastName: args.lastName,
        companyName: args.companyName,
        addressLine1: args.addressLine1,
        addressLine2: args.addressLine2,
        city: args.city,
        provinceOrState: args.provinceOrState,
        postalOrZip: args.postalOrZip,
        countryCode: args.countryCode || "US",
        email: args.email,
        phoneNumber: args.phoneNumber,
        description: args.description,
      });

      const mode = printClient.getModePrefix();
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.companyName || "Unknown";
      const address = [contact.addressLine1, contact.addressLine2, contact.city, contact.provinceOrState, contact.postalOrZip].filter(Boolean).join(", ");

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Contact created successfully.\n\nID: ${contact.id}\nName: ${name}\nAddress: ${address}\n\nUse this contact ID when sending letters or checks.`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
