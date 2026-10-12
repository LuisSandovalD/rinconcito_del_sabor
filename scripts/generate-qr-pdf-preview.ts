import { mkdir, writeFile } from "node:fs/promises";
import { buildPhysicalQrPdf } from "../src/lib/physical-qr-pdf";

const tables = Array.from({ length: 8 }, (_, index) => ({
  id: `preview-${index + 1}`,
  number: index + 1,
  name: null,
  capacity: index % 3 === 0 ? 6 : 4,
  zone: { name: index < 5 ? "Salon principal" : "Terraza" },
  accessToken: `MUESTRA-NO-OPERATIVA-${index + 1}-${"x".repeat(40)}`
}));

const pdf = await buildPhysicalQrPdf({
  tradeName: "MUESTRA - Rinconcito del Sabor",
  address: "Documento de prueba - no operativo",
  origin: "https://muestra.invalid",
  rotatedAt: "2026-10-12T18:00:00.000Z",
  tables
});

await mkdir("output/pdf", { recursive: true });
await writeFile("output/pdf/qr-mesas-vista-previa-no-operativa.pdf", Buffer.from(pdf.output("arraybuffer")));
