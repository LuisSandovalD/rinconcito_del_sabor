import { z } from "zod";
import { createHash } from "node:crypto";
import { handleApiError, ok, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { createOrExtendOrder } from "@/services/orders.service";

const tableOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  tableNumber: z.number().int().positive(),
  accessToken: z.string().min(40).max(100),
  guestCount: z.number().int().min(1).max(20),
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(10),
    notes: z.string().trim().max(300).optional()
  })).min(1).max(20)
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-real-ip") ?? "unknown";
    await rateLimit(`table-order-ip:${ip}`, 40, 5 * 60_000);
    const input = tableOrderSchema.parse(await readJson(request));
    const guestTokenHash = createHash("sha256").update(input.accessToken).digest("hex");
    await rateLimit(`table-order-token:${guestTokenHash}`, 4, 5 * 60_000);
    const table = await db.restaurantTable.findFirst({
      where: { number: input.tableNumber, active: true },
      select: { id: true }
    });
    if (!table) throw new NotFoundError("La mesa indicada no existe o no está disponible.");

    const order = await createOrExtendOrder({
      idempotencyKey: input.idempotencyKey,
      tableId: table.id,
      guestCount: input.guestCount,
      guestTokenHash,
      notes: input.notes,
      items: input.items
    }, undefined, request.headers.get("user-agent") ?? undefined);

    return ok({
      id: order.id,
      number: order.number,
      status: order.status,
      tableNumber: input.tableNumber,
      total: order.total.toString()
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
