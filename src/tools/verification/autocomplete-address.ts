import { verifyClient } from "../../clients/postgrid-verify-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_autocomplete_address",
  description: "Autocomplete a partial street address. Returns matching address suggestions.",
  schema: {
    partialAddress: z.string().describe("Partial street address to autocomplete"),
    countryCode: z.string().optional().describe("Country code filter (default: 'US')"),
  },
  handler: async (args: any) => {
    try {
      const result = await verifyClient.post<any>("/addver/completions", {
        address: args.partialAddress,
        countryCode: args.countryCode || "US",
      });

      const mode = verifyClient.getModePrefix();
      const suggestions = result.data || [];

      if (suggestions.length === 0) {
        return {
          content: [{ type: "text" as const, text: `${mode} No address suggestions found for "${args.partialAddress}".` }],
        };
      }

      const lines = suggestions.map((s: any, i: number) => {
        const addr = [s.line1, s.city, s.provinceOrState, s.postalOrZip].filter(Boolean).join(", ");
        return `  ${i + 1}. ${addr}`;
      });

      return {
        content: [{
          type: "text" as const,
          text: `${mode} Address Suggestions (${suggestions.length}):\n\n${lines.join("\n")}`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
