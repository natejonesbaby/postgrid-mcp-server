import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { estimateCost } from "../../helpers/cost-estimator.js";
import { randomUUID } from "node:crypto";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridLetter } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_create_letter",
  description: "Send a physical letter via PostGrid. Supports standard First Class, Certified Mail, and Certified Mail with Return Receipt. Call without confirmed=true to preview the send details; call with confirmed=true to actually send.",
  schema: {
    to: z.string().describe("Recipient: contact ID (e.g., 'contact_xxx') or inline object as JSON string"),
    from: z.string().describe("Sender: contact ID or inline object as JSON string"),
    html: z.string().optional().describe("Letter content as HTML (use this OR template OR uploadedPDF)"),
    template: z.string().optional().describe("Template ID to use for letter content"),
    uploadedPDF: z.string().optional().describe("URL of a PDF to use as letter content"),
    mailingClass: z.string().optional().describe("Mailing class: 'first_class' (default), 'standard_class', 'certified', 'certified_return_receipt'"),
    color: z.boolean().optional().describe("Print in color (default: false)"),
    doubleSided: z.boolean().optional().describe("Print double-sided (default: false)"),
    envelopeType: z.string().optional().describe("Envelope type (e.g., 'standard_window', 'standard_double_window')"),
    sendDate: z.string().optional().describe("Scheduled send date in YYYY-MM-DD format"),
    description: z.string().optional().describe("Internal description"),
    mergeVariables: z.record(z.string()).optional().describe("Template merge variables as key-value pairs"),
    confirmed: z.boolean().optional().describe("Set to true to confirm and send. Without this, only a preview is returned."),
  },
  handler: async (args: any) => {
    try {
      const mode = printClient.getModePrefix();
      const mc = args.mailingClass || "first_class";

      // Estimate cost
      const cost = estimateCost({ type: "letter", mailingClass: mc, color: args.color });

      // If not confirmed, return preview
      if (!args.confirmed) {
        const preview = [
          `=== CONFIRM: Send Letter (${mode}) ===`,
          `To:       ${args.to}`,
          `From:     ${args.from}`,
          `Class:    ${mc}`,
          `Color:    ${args.color ? "Yes" : "No"}`,
          `Content:  ${args.html ? "HTML" : args.template ? `Template ${args.template}` : args.uploadedPDF ? "PDF" : "Not specified"}`,
          `Est Cost: $${cost.perUnit.toFixed(2)}`,
          args.sendDate ? `Send Date: ${args.sendDate}` : null,
          `==========================================`,
          "",
          "Call this tool again with confirmed=true to send.",
        ].filter(Boolean).join("\n");

        return { content: [{ type: "text" as const, text: preview }] };
      }

      // Build request body
      const body: Record<string, any> = {
        to: args.to,
        from: args.from,
        mailingClass: mc,
      };

      if (args.html) body.html = args.html;
      if (args.template) body.template = args.template;
      if (args.uploadedPDF) body.pdf = args.uploadedPDF;
      if (args.color !== undefined) body.color = args.color;
      if (args.doubleSided !== undefined) body.doubleSided = args.doubleSided;
      if (args.envelopeType) body.envelopeType = args.envelopeType;
      if (args.sendDate) body.sendDate = args.sendDate;
      if (args.description) body.description = args.description;
      if (args.mergeVariables) body.mergeVariables = args.mergeVariables;

      const idempotencyKey = randomUUID();

      const letter = await printClient.post<PostGridLetter>("/letters", body, idempotencyKey);

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Letter sent successfully!\n\nID: ${letter.id}\nStatus: ${letter.status}\nMailing Class: ${mc}\nEst Cost: $${cost.perUnit.toFixed(2)}\n\nUse postgrid_get_letter with this ID to check delivery status.`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
