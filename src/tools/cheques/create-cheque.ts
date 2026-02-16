import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { dollarsToCents, centsToDollars } from "../../helpers/format-money.js";
import { estimateCost } from "../../helpers/cost-estimator.js";
import { generateIdempotencyKey } from "../../helpers/idempotency.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridCheque } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_create_cheque",
  description: "Print and mail a MICR-encoded check via PostGrid. Amount is specified in dollars and converted to cents internally. Call without confirmed=true to preview; call with confirmed=true to send.",
  schema: {
    to: z.string().describe("Recipient: contact ID or inline object as JSON string"),
    from: z.string().describe("Sender: contact ID or inline object as JSON string"),
    bankAccount: z.string().describe("Bank account ID (e.g., 'bank_account_xxx')"),
    amount: z.number().describe("Check amount in dollars (e.g., 1500.00). Converted to cents internally."),
    memo: z.string().optional().describe("Check memo line (max 40 characters)"),
    number: z.number().optional().describe("Check number (auto-increments if omitted)"),
    mailingClass: z.string().optional().describe("Mailing class: 'first_class' (default), 'standard_class'"),
    sendDate: z.string().optional().describe("Scheduled send date in YYYY-MM-DD format"),
    description: z.string().optional().describe("Internal description"),
    letterHTML: z.string().optional().describe("HTML content for an accompanying letter"),
    letterTemplate: z.string().optional().describe("Template ID for an accompanying letter"),
    confirmed: z.boolean().optional().describe("Set to true to confirm and send. Without this, only a preview is returned."),
  },
  handler: async (args: any) => {
    try {
      const mode = printClient.getModePrefix();

      // Validate amount
      if (args.amount <= 0) {
        return { content: [{ type: "text" as const, text: "Error: Check amount must be greater than $0." }] };
      }
      if (args.amount > 100_000) {
        return { content: [{ type: "text" as const, text: "Error: Check amount exceeds $100,000 safety threshold. Please process large checks manually via the PostGrid dashboard." }] };
      }

      // Convert dollars to cents (string-based to avoid floating-point errors)
      const amountCents = dollarsToCents(args.amount);
      const amountFormatted = centsToDollars(amountCents);
      const cost = estimateCost({ type: "cheque" });

      // Validate memo length
      if (args.memo && args.memo.length > 40) {
        return { content: [{ type: "text" as const, text: "Error: Memo cannot exceed 40 characters." }] };
      }

      // If not confirmed, return preview
      if (!args.confirmed) {
        const largeWarning = args.amount > 10_000 ? "\n⚠ WARNING: Large check amount (> $10,000)" : "";
        const preview = [
          `=== CONFIRM: Send Check (${mode}) ===`,
          `To:       ${args.to}`,
          `From:     ${args.from}`,
          `Bank:     ${args.bankAccount}`,
          `Amount:   ${amountFormatted} (${amountCents} cents)`,
          args.memo ? `Memo:     ${args.memo}` : null,
          `Est Cost: $${cost.perUnit.toFixed(2)}`,
          args.sendDate ? `Send Date: ${args.sendDate}` : null,
          `========================================`,
          largeWarning,
          "",
          "Call this tool again with confirmed=true to send.",
        ].filter(Boolean).join("\n");

        return { content: [{ type: "text" as const, text: preview }] };
      }

      // Build request body
      const body: Record<string, any> = {
        to: args.to,
        from: args.from,
        bankAccount: args.bankAccount,
        amount: amountCents,
      };

      if (args.memo) body.memo = args.memo;
      if (args.number !== undefined) body.number = args.number;
      if (args.mailingClass) body.mailingClass = args.mailingClass;
      if (args.sendDate) body.sendDate = args.sendDate;
      if (args.description) body.description = args.description;
      if (args.letterHTML) body.letterHTML = args.letterHTML;
      if (args.letterTemplate) body.letterTemplate = args.letterTemplate;

      const idempotencyKey = generateIdempotencyKey("cheque", {
        to: args.to, from: args.from, bankAccount: args.bankAccount,
        amount: amountCents, memo: args.memo,
      });

      const cheque = await printClient.post<PostGridCheque>("/cheques", body, idempotencyKey);

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Check sent successfully!\n\nID: ${cheque.id}\nAmount: ${amountFormatted} (${amountCents} cents)\nStatus: ${cheque.status}\nEst Cost: $${cost.perUnit.toFixed(2)}\n\nUse postgrid_get_cheque with this ID to check delivery status.`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
