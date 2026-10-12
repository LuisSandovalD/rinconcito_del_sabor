import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { createExternalOrder } from "@/services/external-orders.service";

const schema = z.object({
  idempotencyKey: z.string().uuid(),
  type: z.enum(["TAKEAWAY", "DELIVERY"]),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().max(30).optional(),
  deliveryAddress: z.string().trim().max(240).optional(),
  deliveryReference: z.string().trim().max(240).optional(),
  notes: z.string().trim().max(300).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(30),
    notes: z.string().trim().max(200).optional()
  })).min(1)
});

export async function GET() {
  try {
    await requirePermission("delivery.view");
    return ok(await db.order.findMany({
      where: { type: { in: ["TAKEAWAY", "DELIVERY"] }, status: { notIn: ["PAID", "CANCELLED", "VOIDED"] } },
      include: { items: true, delivery: true, waiter: true },
      orderBy: { openedAt: "desc" }
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("delivery.manage");
    const input = schema.parse(await readJson(request));
    const order = await createExternalOrder(input, {
      actorId: user.id,
      source: "BACKOFFICE",
      userAgent: request.headers.get("user-agent") ?? undefined
    });
    return ok(order, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
