import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, z.ZodType<any, any>>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (args: any, extra: any) => Promise<any>;
}
