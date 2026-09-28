import { Prisma } from "../../generated/prisma/client";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";

type PayInput = {
  idempotencyKey: string;
  orderId: string;
  payments: Array<{ method: "CASH" | "YAPE" | "PLIN" | "CARD" | "TRANSFER" | "OTHER"; amount: number; receivedAmount?: number; reference?: string }>;
};

export async function payOrder(input: PayInput, actorId: string) {
  const existing = await db.idempotencyOperation.findUnique({ where: { scope_key: { scope: "PAYMENT", key: input.idempotencyKey } } });
  if (existing?.resultId) return db.sale.findUniqueOrThrow({ where: { id: existing.resultId }, include: { payments: true, order: { include: { table: true } } } });

  const saleId = await db.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: input.orderId }, include: { items: { include: { product: { include: { recipeItems: true } } } }, tableSession: true } });
    if (!order) throw new NotFoundError("Cuenta no encontrada.");
    if (order.status === "PAID" || await tx.sale.findUnique({ where: { orderId: order.id } })) throw new ConflictError("Esta cuenta ya fue pagada.");
    if (!(["DELIVERED", "PENDING_PAYMENT", "READY"] as string[]).includes(order.status)) throw new ConflictError("La cuenta todavía no está lista para cobrar.");
    const paid = input.payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (Math.abs(paid - order.total.toNumber()) > 0.009) throw new ValidationError(`El total de pagos debe ser S/ ${order.total.toFixed(2)}.`);
    const openCash = await tx.cashSession.findFirst({ where: { userId: actorId, status: "OPEN" }, orderBy: { openedAt: "desc" } });
    if (!openCash) throw new ConflictError("Abre una caja antes de registrar el pago.");

    const sale = await tx.sale.create({ data: { orderId: order.id, subtotal: order.subtotal, discount: order.discount, tax: order.tax, total: order.total } });
    for (const [index, payment] of input.payments.entries()) {
      const change = payment.method === "CASH" ? Math.max(0, (payment.receivedAmount ?? payment.amount) - payment.amount) : 0;
      await tx.payment.create({ data: { idempotencyKey: `${input.idempotencyKey}:${index}`, saleId: sale.id, cashSessionId: openCash.id, method: payment.method, amount: payment.amount, receivedAmount: payment.receivedAmount, changeAmount: change, reference: payment.reference } });
      if (payment.method === "CASH") await tx.cashMovement.create({ data: { sessionId: openCash.id, idempotencyKey: `${input.idempotencyKey}:movement:${index}`, type: "SALE", amount: payment.amount, reference: `Venta #${order.number} · Efectivo` } });
    }

    for (const item of order.items) {
      for (const recipe of item.product.recipeItems) {
        const ingredient = await tx.ingredient.findUniqueOrThrow({ where: { id: recipe.ingredientId } });
        const consumed = recipe.quantity.mul(item.quantity);
        const balance = Prisma.Decimal.max(0, ingredient.stock.minus(consumed));
        await tx.ingredient.update({ where: { id: ingredient.id }, data: { stock: balance } });
        await tx.inventoryMovement.create({ data: { ingredientId: ingredient.id, idempotencyKey: `${input.idempotencyKey}:${item.id}:${ingredient.id}`, type: "RECIPE_CONSUMPTION", quantity: consumed.negated(), balanceAfter: balance, reference: `Pedido #${order.number}` } });
        if (balance.lte(0)) {
          await tx.product.updateMany({ where: { recipeItems: { some: { ingredientId: ingredient.id } } }, data: { availability: "SOLD_OUT" } });
        }
      }
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date(), version: { increment: 1 } } });
    if (order.tableId) await tx.restaurantTable.update({ where: { id: order.tableId }, data: { status: "FREE", version: { increment: 1 } } });
    if (order.tableSessionId) await tx.tableSession.update({ where: { id: order.tableSessionId }, data: { status: "CLOSED", closedAt: new Date() } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, actorId, fromStatus: order.status, toStatus: "PAID" } });
    await tx.idempotencyOperation.create({ data: { scope: "PAYMENT", key: input.idempotencyKey, resultId: sale.id, expiresAt: new Date(Date.now() + 7 * 86_400_000) } });
    await recordAudit(tx, { userId: actorId, action: "PAYMENT_COMPLETED", module: "payments", entity: "Sale", entityId: sale.id, after: { total: order.total.toNumber(), methods: input.payments.map(payment => payment.method) }, metadata: { orderNumber: order.number } });
    return sale.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await publishRealtimeEvent({ resource: "payments", action: "created", id: saleId });
  await publishRealtimeEvent({ resource: "orders", action: "status_changed", id: input.orderId });
  await publishRealtimeEvent({ resource: "tables", action: "status_changed" });
  await publishRealtimeEvent({ resource: "inventory", action: "updated" });
  return db.sale.findUniqueOrThrow({ where: { id: saleId }, include: { payments: true, order: { include: { table: true } } } });
}
