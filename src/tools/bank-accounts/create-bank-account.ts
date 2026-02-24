import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridBankAccount } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_create_bank_account",
  description: "Create a bank account for check printing. WARNING: Bank account details (account/routing numbers) will transit through chat history. For security, consider creating bank accounts via the PostGrid dashboard instead.",
  schema: {
    bankName: z.string().describe("Name of the bank"),
    bankCountryCode: z.string().optional().describe("Bank country code (default: 'US')"),
    routingNumber: z.string().describe("Bank routing number (9 digits for US)"),
    accountNumber: z.string().describe("Bank account number"),
    signatureText: z.string().optional().describe("Signature as text (printed on checks)"),
    signatureImage: z.string().optional().describe("URL to signature image"),
    description: z.string().optional().describe("Internal description"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const body: Record<string, any> = {
        bankName: args.bankName,
        bankCountryCode: args.bankCountryCode || "US",
        routingNumber: args.routingNumber,
        accountNumber: args.accountNumber,
      };
      if (args.signatureText) body.signatureText = args.signatureText;
      if (args.signatureImage) body.signatureImage = args.signatureImage;
      if (args.description) body.description = args.description;

      const account = await printClient.post<PostGridBankAccount>("/bank_accounts", body);
      const mode = printClient.getModePrefix();

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Bank account created.\n\nID: ${account.id}\nBank: ${account.bankName}\nAccount: ***${(args.accountNumber as string).slice(-4)}\nRouting: ***${(args.routingNumber as string).slice(-4)}\n\nUse this bank account ID when creating checks.`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
