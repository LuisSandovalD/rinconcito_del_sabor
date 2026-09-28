import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";

const productSchema = z.object({
  name: z.string().trim().min(2).max(100), slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/), description: z.string().max(500).optional(),
  price: z.number().positive(), cost: z.number().min(0).default(0), estimatedMinutes: z.number().int().min(1).max(240).optional(), categoryId: z.string().min(1), stationId: z.string().optional(), imageUrl: z.url().optional(), imagePublicId: z.string().optional()
});

export async function GET(request: Request) {
  try {
    await requirePermission("products.view");
    const url = new URL(request.url);
    const availableOnly = url.searchParams.get("available") === "true";
    const products = await db.product.findMany({
      where: { active: true, ...(availableOnly ? { availability: { in: ["AVAILABLE", "LOW_STOCK"] } } : {}) },
      include: { category: true, station: true, variants: { where: { active: true } }, addons: { where: { active: true } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }]
    });
    const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    const stations = await db.station.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    return ok({ products, categories, stations });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("products.create");
    const input = productSchema.parse(await readJson(request));
    const product = await db.$transaction(async tx => {
      const row = await tx.product.create({ data: input });
      await recordAudit(tx, { userId: user.id, action: "PRODUCT_CREATED", module: "products", entity: "Product", entityId: row.id, after: { name: row.name, price: row.price.toNumber() } });
      return row;
    });
    await publishRealtimeEvent({ resource: "products", action: "created", id: product.id });
    return ok(product, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
