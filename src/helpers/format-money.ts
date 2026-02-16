/**
 * String-based dollar-to-cents conversion to avoid floating-point errors.
 * Example: 19.99 * 100 = 1998.9999999999998 in JS, but this returns 1999.
 */
export function dollarsToCents(amount: number): number {
  if (amount < 0) throw new Error(`Amount cannot be negative: ${amount}`);
  if (amount === 0) throw new Error("Amount cannot be zero");

  const str = String(amount);
  if (str.includes("e") || str.includes("E")) {
    throw new Error(`Scientific notation not supported: ${str}`);
  }

  const parts = str.split(".");
  const whole = parts[0];
  let fractional = parts[1] || "";

  if (fractional.length > 2) {
    throw new Error(`Sub-cent precision not allowed: $${str}`);
  }

  fractional = fractional.padEnd(2, "0");
  return parseInt(whole + fractional, 10);
}

/**
 * Format cents as a dollar string.
 * Example: 150000 -> "$1,500.00"
 */
export function centsToDollars(cents: number): string {
  const dollars = Math.floor(Math.abs(cents) / 100);
  const remainder = Math.abs(cents) % 100;
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${dollars.toLocaleString("en-US")}.${String(remainder).padStart(2, "0")}`;
}
