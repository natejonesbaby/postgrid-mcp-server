import { verifyClient } from "../../clients/postgrid-verify-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_verify_address",
  description: "Verify a single US/CA address using PostGrid Address Verification. Returns verified, corrected (with before/after diff), or failed status.",
  schema: {
    line1: z.string().optional().describe("Street address line 1 (structured input)"),
    line2: z.string().optional().describe("Address line 2"),
    city: z.string().optional().describe("City"),
    provinceOrState: z.string().optional().describe("State/province code"),
    postalOrZip: z.string().optional().describe("ZIP/postal code"),
    countryCode: z.string().optional().describe("Country code (default: 'US')"),
    freeformAddress: z.string().optional().describe("Full address as a single string (alternative to structured fields)"),
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const body: Record<string, string> = {};
      if (args.freeformAddress) {
        body.address = args.freeformAddress as string;
      } else {
        if (args.line1) body.line1 = args.line1 as string;
        if (args.line2) body.line2 = args.line2 as string;
        if (args.city) body.city = args.city as string;
        if (args.provinceOrState) body.provinceOrState = args.provinceOrState as string;
        if (args.postalOrZip) body.postalOrZip = args.postalOrZip as string;
        body.countryCode = (args.countryCode as string | undefined) || "US";
      }

      const result = await verifyClient.post<any>("/verifications", body);
      const mode = verifyClient.getModePrefix();
      const status = result.status || "unknown";
      const verified = result.verifiedAddress || {};

      const lines = [
        `${mode} Address Verification: ${status.toUpperCase()}`,
        "",
      ];

      if (status === "corrected" || status === "verified") {
        lines.push("Verified Address:");
        lines.push(`  ${verified.line1 || ""}`);
        if (verified.line2) lines.push(`  ${verified.line2}`);
        lines.push(`  ${verified.city || ""}, ${verified.provinceOrState || ""} ${verified.postalOrZip || ""}`);
        lines.push(`  ${verified.countryCode || "US"}`);
      }

      if (status === "corrected") {
        lines.push("");
        lines.push("Note: Address was corrected. Review the changes above.");
      }

      if (status === "failed") {
        lines.push("The address could not be verified. Please check for typos.");
        if (result.errors?.length) {
          lines.push(`Errors: ${result.errors.join(", ")}`);
        }
      }

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
