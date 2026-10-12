import { describe, expect, it } from "vitest";
import { buildPhysicalQrPdf } from "../src/lib/physical-qr-pdf";

describe("physical table QR PDF", () => {
  it("lays out six printable QR cards per A4 page", async () => {
    const tables = Array.from({ length: 7 }, (_, index) => ({
      id: `table-${index + 1}`,
      number: index + 1,
      name: null,
      capacity: 4,
      zone: { name: index < 4 ? "Salón" : "Terraza" },
      accessToken: `secure-token-${String(index + 1).padStart(2, "0")}-${"x".repeat(40)}`
    }));

    const pdf = await buildPhysicalQrPdf({
      tradeName: "Rinconcito del Sabor",
      address: "Lima, Perú",
      origin: "https://restaurant.example",
      rotatedAt: "2026-10-12T18:00:00.000Z",
      tables
    });

    expect(pdf.getNumberOfPages()).toBe(2);
    expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(25_000);
  });
});
