import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrExtendOrder } from "@/services/orders.service";

const schema = z.object({
  idempotencyKey: z.string().uuid(), tableId: z.string().min(1), guestCount: z.number().int().min(1).max(50), priority: z.enum(["NORMAL", "PRIORITY", "RUSH", "CHILD"]).optional(), notes: z.string().max(500).optional(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(50), notes: z.string().max(300).optional(), modifiers: z.array(z.object({ name: z.string().min(1).max(80), priceDelta: z.number().min(0).max(100).optional() })).optional() })).min(1)
});

export async function GET(request: Request) {
  try {
    await requirePermission("orders.view");
    const url = new URL(request.url);
    const view = url.searchParams.get("view");
    const statuses = view === "kitchen" ? ["SENT", "RECEIVED", "PREPARING", "PARTIALLY_READY", "READY"] as const : view === "cash" ? ["READY", "DELIVERED", "PENDING_PAYMENT"] as const : undefined;
    const orders = await db.order.findMany({
      where: statuses ? { status: { in: [...statuses] } } : { status: { notIn: ["PAID", "CANCELLED", "VOIDED"] } },
      include: { table: { include: { zone: true } }, waiter: true, items: { include: { modifiers: true, product: { include: { station: true } } } }, tickets: { include: { station: true } } },
      orderBy: [{ priority: "desc" }, { sentAt: "asc" }]
    });
    return ok(orders);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("orders.create");
    const input = schema.parse(await readJson(request));
    return ok(await createOrExtendOrder(input, user.id, request.headers.get("user-agent") ?? undefined), { status: 201 });
  } catch (error) { return handleApiError(error); }
}
