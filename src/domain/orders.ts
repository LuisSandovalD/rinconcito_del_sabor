export function calculateOrderTotals(lines: Array<{ unitPrice: number; quantity: number }>, taxRate = 18, pricesIncludeTax = true, discount = 0) {
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100;
  const tax = Math.round((pricesIncludeTax ? subtotal * taxRate / (100 + taxRate) : subtotal * taxRate / 100) * 100) / 100;
  const total = Math.round((pricesIncludeTax ? subtotal - discount : subtotal + tax - discount) * 100) / 100;
  return { subtotal, tax, discount, total };
}

export function deriveOrderReadiness(statuses: string[]) {
  const relevant = statuses.filter(status => status !== "CANCELLED");
  const ready = relevant.filter(status => status === "READY" || status === "DELIVERED").length;
  return { ready, total: relevant.length, status: ready === relevant.length && relevant.length > 0 ? "READY" : ready > 0 ? "PARTIALLY_READY" : "PREPARING" } as const;
}

export function validatePaymentSplit(total: number, payments: Array<{ amount: number }>) {
  const paid = Math.round(payments.reduce((sum, payment) => sum + payment.amount, 0) * 100) / 100;
  return { paid, remaining: Math.round((total - paid) * 100) / 100, complete: Math.abs(total - paid) < 0.01 };
}
