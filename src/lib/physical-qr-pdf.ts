import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export type PhysicalQrCredential = {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  zone: { name: string };
  accessToken: string;
};

type PhysicalQrPdfInput = {
  tradeName: string;
  address?: string | null;
  origin: string;
  rotatedAt: string | Date;
  tables: PhysicalQrCredential[];
};

const safeFilename = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .toLowerCase();

export async function buildPhysicalQrPdf(input: PhysicalQrPdfInput) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 9;
  const marginY = 8;
  const gapX = 4;
  const gapY = 4;
  const columns = 2;
  const rows = 3;
  const cardsPerPage = columns * rows;
  const cardWidth = (pageWidth - marginX * 2 - gapX) / columns;
  const cardHeight = (pageHeight - marginY * 2 - gapY * 2 - 5) / rows;
  const rotatedLabel = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(new Date(input.rotatedAt));

  for (let index = 0; index < input.tables.length; index += 1) {
    if (index > 0 && index % cardsPerPage === 0) pdf.addPage();
    const position = index % cardsPerPage;
    const column = position % columns;
    const row = Math.floor(position / columns);
    const x = marginX + column * (cardWidth + gapX);
    const y = marginY + row * (cardHeight + gapY);
    const table = input.tables[index];
    const tableLabel = table.name?.trim() || `Mesa ${String(table.number).padStart(2, "0")}`;
    const url = `${input.origin}/menu/mesa/${table.number}#access=${table.accessToken}`;
    const qrImage = await QRCode.toDataURL(url, { errorCorrectionLevel: "H", margin: 2, width: 640, color: { dark: "#111827", light: "#FFFFFF" } });

    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, "S");
    pdf.setFillColor(255, 99, 99);
    pdf.roundedRect(x, y, cardWidth, 4, 2.5, 2.5, "F");
    pdf.rect(x, y + 2, cardWidth, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(9);
    pdf.text(input.tradeName, x + cardWidth / 2, y + 10, { align: "center", maxWidth: cardWidth - 10 });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(6.5);
    if (input.address) pdf.text(input.address, x + cardWidth / 2, y + 14, { align: "center", maxWidth: cardWidth - 12 });

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(18);
    pdf.text(tableLabel, x + cardWidth / 2, y + 22, { align: "center", maxWidth: cardWidth - 12 });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(255, 99, 99);
    pdf.setFontSize(7.5);
    pdf.text(`${table.zone.name.toUpperCase()} - ${table.capacity} PERSONAS`, x + cardWidth / 2, y + 27, { align: "center", maxWidth: cardWidth - 12 });

    const qrSize = 43;
    pdf.addImage(qrImage, "PNG", x + (cardWidth - qrSize) / 2, y + 30, qrSize, qrSize, undefined, "FAST");

    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text("Escanea para pedir desde tu mesa", x + cardWidth / 2, y + 78, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(6.5);
    pdf.text("Tu pedido sera validado por el personal antes de ir a cocina.", x + cardWidth / 2, y + 82, { align: "center", maxWidth: cardWidth - 10 });
    pdf.setFontSize(5.5);
    pdf.text(`Seguridad rotada: ${rotatedLabel}`, x + cardWidth / 2, y + cardHeight - 2.5, { align: "center" });
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(6);
    pdf.text(`Hoja ${page} de ${pages}`, pageWidth / 2, pageHeight - 1.8, { align: "center" });
  }

  return pdf;
}

export async function downloadPhysicalQrPdf(input: PhysicalQrPdfInput) {
  const pdf = await buildPhysicalQrPdf(input);
  const date = new Date(input.rotatedAt).toISOString().slice(0, 10);
  pdf.save(`qr-mesas-${safeFilename(input.tradeName) || "restaurante"}-${date}.pdf`);
}
