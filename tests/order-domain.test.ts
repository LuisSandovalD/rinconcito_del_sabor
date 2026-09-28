import { describe, expect, it } from "vitest";
import { calculateOrderTotals, deriveOrderReadiness, validatePaymentSplit } from "../src/domain/orders";

describe("restaurant order rules", () => {
  it("keeps tax inside tax-inclusive Peruvian prices", () => {
    expect(calculateOrderTotals([{ unitPrice: 36, quantity: 2 }, { unitPrice: 12, quantity: 1 }])).toEqual({ subtotal: 84, tax: 12.81, discount: 0, total: 84 });
  });
  it("marks a command partially ready per product", () => {
    expect(deriveOrderReadiness(["READY", "PREPARING", "READY"])).toEqual({ ready: 2, total: 3, status: "PARTIALLY_READY" });
    expect(deriveOrderReadiness(["READY", "READY"])).toEqual({ ready: 2, total: 2, status: "READY" });
  });
  it("accepts exact mixed payments and rejects missing value", () => {
    expect(validatePaymentSplit(100, [{ amount: 50 }, { amount: 30 }, { amount: 20 }])).toMatchObject({ complete: true, remaining: 0 });
    expect(validatePaymentSplit(100, [{ amount: 90 }])).toMatchObject({ complete: false, remaining: 10 });
  });
});
