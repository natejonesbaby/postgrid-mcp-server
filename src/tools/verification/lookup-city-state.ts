import { verifyClient } from "../../clients/postgrid-verify-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_lookup_city_state",
  description: "Look up city and state from a ZIP/postal code.",
  schema: {
    postalOrZip: z.string().describe("ZIP or postal code to look up"),
    countryCode: z.string().optional().describe("Country code (default: 'US')"),
  },
  handler: async (args: any) => {
    try {
      const result = await verifyClient.post<any>("/addver/lookups", {
        postalOrZip: args.postalOrZip,
        countryCode: args.countryCode || "US",
      });

      const mode = verifyClient.getModePrefix();
      const city = result.city || "Unknown";
      const state = result.provinceOrState || "Unknown";

      return {
        content: [{
          type: "text" as const,
          text: `${mode} ZIP ${args.postalOrZip} → ${city}, ${state}`,
        }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
