import { describe, expect, it } from "vitest";
import { validateTableQrValue } from "../src/lib/table-qr";

const origin = "https://rinconcito.example";
const token = "a".repeat(43);

describe("secure table QR validation", () => {
  it("accepts only a signed-looking table URL from this restaurant", () => {
    expect(validateTableQrValue(`${origin}/menu/mesa/12#access=${token}`, origin)).toBe(`${origin}/menu/mesa/12#access=${token}`);
  });

  it("rejects external origins", () => {
    expect(() => validateTableQrValue(`https://attacker.example/menu/mesa/12#access=${token}`, origin)).toThrow(/no pertenece/);
  });

  it("rejects an altered route or short credential", () => {
    expect(() => validateTableQrValue(`${origin}/menu/mesa/admin#access=${token}`, origin)).toThrow(/QR válido/);
    expect(() => validateTableQrValue(`${origin}/menu/mesa/12#access=short`, origin)).toThrow(/alterado/);
  });
});
