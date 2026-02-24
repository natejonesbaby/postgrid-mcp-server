import { z } from "zod";

export type ToolResponse = {
  content: Array<{ type: "text"; text: string }>;
};

export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, z.ZodType<unknown>>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (args: Record<string, unknown>) => Promise<ToolResponse>;
}
