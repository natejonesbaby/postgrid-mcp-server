import { verifyClient } from "../../clients/postgrid-verify-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_verify_addresses_batch",
  description: "Verify multiple addresses at once (up to 2,000). Addresses are chunked into batches of 500. Returns verification status for each address.",
  schema: {
    addresses: z.array(z.object({
      line1: z.string().describe("Street address line 1"),
      line2: z.string().optional().describe("Address line 2"),
      city: z.string().optional().describe("City"),
      provinceOrState: z.string().optional().describe("State/province"),
      postalOrZip: z.string().optional().describe("ZIP/postal code"),
      countryCode: z.string().optional().describe("Country code (default: 'US')"),
    })).describe("Array of addresses to verify (max 2,000)"),
  },
  handler: async (args: any) => {
    try {
      const addresses: any[] = args.addresses;
      if (addresses.length > 2000) {
        return { content: [{ type: "text" as const, text: "Error: Maximum 2,000 addresses per batch." }] };
      }

      // Chunk into batches of 500
      const chunks: any[][] = [];
      for (let i = 0; i < addresses.length; i += 500) {
        chunks.push(addresses.slice(i, i + 500));
      }

      const allResults: any[] = [];
      for (const chunk of chunks) {
        const result = await verifyClient.post<any>("/verifications/batch", { addresses: chunk });
        if (result.data) allResults.push(...result.data);
        // Small delay between chunks to be respectful of rate limits
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      const mode = verifyClient.getModePrefix();
      const verified = allResults.filter((r: any) => r.status === "verified").length;
      const corrected = allResults.filter((r: any) => r.status === "corrected").length;
      const failed = allResults.filter((r: any) => r.status === "failed").length;

      const summary = [
        `${mode} Batch Address Verification Complete`,
        "",
        `Total: ${allResults.length}`,
        `Verified: ${verified}`,
        `Corrected: ${corrected}`,
        `Failed: ${failed}`,
      ];

      if (failed > 0) {
        summary.push("");
        summary.push("Failed addresses:");
        allResults
          .filter((r: any) => r.status === "failed")
          .slice(0, 10) // Show first 10 failures
          .forEach((r: any, i: number) => {
            summary.push(`  ${i + 1}. ${r.line1 || "N/A"}, ${r.city || ""} ${r.provinceOrState || ""}`);
          });
        if (failed > 10) summary.push(`  ... and ${failed - 10} more`);
      }

      return {
        content: [{ type: "text" as const, text: summary.join("\n") }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
