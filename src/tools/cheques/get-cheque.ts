import { printClient } from "../../clients/postgrid-print-client.js";
import { formatError } from "../../helpers/format-error.js";
import { centsToDollars } from "../../helpers/format-money.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { PostGridCheque } from "../../types/postgrid.types.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_get_cheque",
  description: "Get a check's details, status, and tracking information by ID.",
  schema: {
    id: z.string().describe("Cheque ID (e.g., 'cheque_xxx')"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const cheque = await printClient.get<PostGridCheque>(`/cheques/${args.id}`);
      const mode = printClient.getModePrefix();

      const toName = typeof cheque.to === "object"
        ? [cheque.to.firstName, cheque.to.lastName].filter(Boolean).join(" ") || cheque.to.companyName
        : cheque.to;

      const lines = [
        `${mode} Cheque: ${cheque.id}`,
        "",
        `Status:   ${cheque.status}`,
        `To:       ${toName || "N/A"}`,
        `Amount:   ${centsToDollars(cheque.amount)} (${cheque.amount} cents)`,
        cheque.memo ? `Memo:     ${cheque.memo}` : null,
        cheque.number ? `Number:   ${cheque.number}` : null,
        `Tracking: ${cheque.trackingNumber || "Not yet available"}`,
        `Created:  ${cheque.createdAt}`,
        cheque.url ? `PDF URL: ${cheque.url}` : null,
      ].filter(Boolean);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
