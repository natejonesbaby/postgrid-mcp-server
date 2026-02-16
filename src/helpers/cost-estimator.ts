/**
 * Hardcoded PostGrid rate table for cost estimation.
 * These are approximate rates — actual costs may vary.
 */
const RATES: Record<string, number> = {
  // Letters
  "letter_first_class_bw": 1.019,
  "letter_first_class_color": 1.179,
  "letter_standard_bw": 0.689,
  "letter_standard_color": 0.849,
  "letter_certified": 6.69,
  "letter_certified_return_receipt": 9.51,
  "letter_express": 15.00,
  // Cheques
  "cheque": 1.10,
  // Extra pages
  "additional_page_bw": 0.10,
  "additional_page_color": 0.15,
};

export interface CostEstimate {
  perUnit: number;
  total: number;
  breakdown: string;
}

export function estimateCost(options: {
  type: "letter" | "cheque";
  mailingClass?: string;
  color?: boolean;
  pageCount?: number;
  quantity?: number;
}): CostEstimate {
  const { type, mailingClass, color, pageCount = 1, quantity = 1 } = options;

  let rateKey: string;
  let perUnit: number;

  if (type === "cheque") {
    perUnit = RATES["cheque"];
    rateKey = "cheque";
  } else {
    const mc = mailingClass || "first_class";
    if (mc === "certified") {
      rateKey = "letter_certified";
    } else if (mc === "certified_return_receipt") {
      rateKey = "letter_certified_return_receipt";
    } else if (mc === "express") {
      rateKey = "letter_express";
    } else {
      const colorSuffix = color ? "color" : "bw";
      rateKey = mc === "standard_class"
        ? `letter_standard_${colorSuffix}`
        : `letter_first_class_${colorSuffix}`;
    }
    perUnit = RATES[rateKey] ?? RATES["letter_first_class_bw"];
  }

  // Add extra page costs
  if (pageCount > 1) {
    const extraPageRate = color
      ? RATES["additional_page_color"]
      : RATES["additional_page_bw"];
    perUnit += (pageCount - 1) * extraPageRate;
  }

  const total = perUnit * quantity;

  const breakdown = [
    `Base: $${RATES[rateKey]?.toFixed(2) ?? "N/A"}/unit`,
    pageCount > 1 ? `Extra pages (${pageCount - 1}): $${((pageCount - 1) * (color ? 0.15 : 0.10)).toFixed(2)}/unit` : null,
    quantity > 1 ? `Quantity: ${quantity}` : null,
    `Per unit: $${perUnit.toFixed(2)}`,
    `Total: $${total.toFixed(2)}`,
  ].filter(Boolean).join("\n");

  return { perUnit, total, breakdown };
}

export function getRateTable(): string {
  return [
    "PostGrid Rate Table (approximate):",
    "| Item | Cost |",
    "|------|------|",
    "| Standard letter (B&W, First Class) | $1.019 |",
    "| Standard letter (Color, First Class) | $1.179 |",
    "| Standard letter (B&W, Standard) | $0.689 |",
    "| Standard letter (Color, Standard) | $0.849 |",
    "| Certified Mail | $6.69 |",
    "| Certified Mail + Return Receipt | $9.51 |",
    "| Express delivery | $15.00 |",
    "| Check (8.5x11 MICR) | $1.10 |",
    "| Additional page (B&W) | $0.10 |",
    "| Additional page (Color) | $0.15 |",
  ].join("\n");
}
