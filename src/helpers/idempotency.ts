import { createHash } from "crypto";

/**
 * Generate a deterministic idempotency key based on operation and parameters.
 * Keys are scoped to the current date (UTC) so the same operation on different
 * days produces different keys. PostGrid honors idempotency keys for 24 hours.
 */
export function generateIdempotencyKey(
  operation: string,
  params: Record<string, unknown>
): string {
  const date = new Date().toISOString().split("T")[0];
  const normalized = JSON.stringify({ operation, ...params, date });
  const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 32);
  return `postgrid_${operation}_${hash}`;
}
