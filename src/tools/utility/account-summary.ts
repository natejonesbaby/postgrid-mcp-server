import { printClient } from "../../clients/postgrid-print-client.js";
import { getRateTable } from "../../helpers/cost-estimator.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

export const ToolExport: ToolDefinition = {
  name: "postgrid_account_summary",
  description: "Show PostGrid account status: API mode (test/live), connectivity, and the rate table.",
  schema: {},
  handler: async () => {
    try {
      const mode = printClient.getMode();
      const prefix = printClient.getModePrefix();

      // Quick connectivity check — list contacts with limit 1
      let connected = false;
      try {
        await printClient.get("/contacts", { limit: 1 });
        connected = true;
      } catch {
        connected = false;
      }

      const lines = [
        `${prefix} PostGrid Account Summary`,
        "",
        `Mode:        ${mode}`,
        `Connected:   ${connected ? "Yes" : "No — check your API key"}`,
        "",
        getRateTable(),
      ];

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (error) {
      return { content: [{ type: "text" as const, text: formatError(error) }] };
    }
  },
};
