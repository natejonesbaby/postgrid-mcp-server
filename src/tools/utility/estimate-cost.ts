import { estimateCost, getRateTable } from "../../helpers/cost-estimator.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_estimate_cost",
  description: "Estimate the cost of sending a letter or check without making an API call. Uses PostGrid's published rate table.",
  schema: {
    type: z.enum(["letter", "cheque"]).describe("Type: 'letter' or 'cheque'"),
    mailingClass: z.string().optional().describe("Mailing class: 'first_class', 'standard_class', 'certified', 'certified_return_receipt' (letters only)"),
    color: z.boolean().optional().describe("Color printing (default: false, letters only)"),
    pageCount: z.number().optional().describe("Number of pages (default: 1, letters only)"),
    quantity: z.number().optional().describe("Number of items to send (default: 1)"),
  },
  handler: async (args: Record<string, unknown>) => {
    const estimate = estimateCost({
      type: args.type as "letter" | "cheque",
      mailingClass: args.mailingClass as string | undefined,
      color: args.color as boolean | undefined,
      pageCount: args.pageCount as number | undefined,
      quantity: args.quantity as number | undefined,
    });

    return {
      content: [{
        type: "text" as const,
        text: `Cost Estimate:\n\n${estimate.breakdown}`,
      }],
    };
  },
};
