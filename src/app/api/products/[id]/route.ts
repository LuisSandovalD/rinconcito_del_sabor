import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";
import { cloudinaryService } from "@/services/storage/cloudinary.service";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(), price: z.number().positive().optional(), cost: z.number().min(0).optional(),
  availability: z.enum(["AVAILABLE", "LOW_STOCK", "SOLD_OUT", "TEMPORARILY_UNAVAILABLE"]).optional(), active: z.boolean().optional(), imageUrl: z.url().nullable().optional(), imagePublicId: z.string().nullable().optional()
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const input = schema.parse(await readJson(request));
    const permission = input.price !== undefined ? "products.change_price" : "products.update";
    const user = await requirePermission(permission);
    const { id } = await context.params;
    const before = await db.product.findUnique({ where: { id } });
    if (!before) throw new NotFoundError("Producto no encontrado.");
    const product = await db.$transaction(async tx => {
      const row = await tx.product.update({ where: { id }, data: input });
      await recordAudit(tx, { userId: user.id, action: input.availability ? "PRODUCT_AVAILABILITY_CHANGED" : "PRODUCT_UPDATED", module: "products", entity: "Product", entityId: id, before: { name: before.name, price: before.price.toNumber(), availability: before.availability }, after: { name: row.name, price: row.price.toNumber(), availability: row.availability } });
      return row;
    });
    if (input.imagePublicId && before.imagePublicId && input.imagePublicId !== before.imagePublicId) {
      try { await cloudinaryService.destroy(before.imagePublicId); }
      catch (cleanupError) { logger.warn("Cloudinary old image cleanup failed", { productId: id, error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) }); }
    }
    await publishRealtimeEvent({ resource: "products", action: input.availability ? "status_changed" : "updated", id });
    return ok(product);
  } catch (error) { return handleApiError(error); }
}
