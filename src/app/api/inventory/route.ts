import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";

const schema = z.object({ ingredientId: z.string().min(1), quantity: z.number(), type: z.enum(["PURCHASE", "ADJUSTMENT", "LOSS", "DAMAGE", "EXPIRATION"]), reason: z.string().min(3).max(200), idempotencyKey: z.string().uuid() });

export async function GET() {
  try { await requirePermission("inventory.view"); return ok(await db.ingredient.findMany({ where: { active: true }, include: { movements: { orderBy: { createdAt: "desc" }, take: 3 } }, orderBy: { name: "asc" } })); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("inventory.adjust");
    const input = schema.parse(await readJson(request));
    const result = await db.$transaction(async tx => {
      const ingredient = await tx.ingredient.findUniqueOrThrow({ where: { id: input.ingredientId } });
      const delta = ["LOSS", "DAMAGE", "EXPIRATION"].includes(input.type) ? -Math.abs(input.quantity) : input.quantity;
      const balance = ingredient.stock.plus(delta);
      const movement = await tx.inventoryMovement.create({ data: { ingredientId: ingredient.id, idempotencyKey: input.idempotencyKey, type: input.type, quantity: delta, balanceAfter: balance, reason: input.reason } });
      await tx.ingredient.update({ where: { id: ingredient.id }, data: { stock: balance } });
      await recordAudit(tx, { userId: user.id, action: "INVENTORY_ADJUSTED", module: "inventory", entity: "Ingredient", entityId: ingredient.id, before: { stock: ingredient.stock.toNumber() }, after: { stock: balance.toNumber() }, metadata: { reason: input.reason, type: input.type } });
      return movement;
    });
    await publishRealtimeEvent({ resource: "inventory", action: "updated", id: input.ingredientId });
    return ok(result, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
