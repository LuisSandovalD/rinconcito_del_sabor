import { Prisma } from "../../generated/prisma/client";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";

export type CreateOrderInput = {
  idempotencyKey: string;
  tableId: string;
  guestCount: number;
  priority?: "NORMAL" | "PRIORITY" | "RUSH" | "CHILD";
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
    modifiers?: Array<{ name: string; priceDelta?: number }>;
  }>;
};

const activeOrderStatuses = ["NEW", "CONFIRMED", "SENT", "RECEIVED", "PREPARING", "PARTIALLY_READY", "READY", "DELIVERED", "PENDING_PAYMENT"] as const;

export async function createOrExtendOrder(input: CreateOrderInput, actorId: string, device?: string) {
  if (!input.items.length) throw new ValidationError("Agrega al menos un producto al pedido.");
  const existingOperation = await db.idempotencyOperation.findUnique({ where: { scope_key: { scope: "ORDER_SUBMIT", key: input.idempotencyKey } } });
  if (existingOperation?.resultId) return getOrder(existingOperation.resultId);

  const result = await db.$transaction(async tx => {
    const table = await tx.restaurantTable.findUnique({ where: { id: input.tableId } });
    if (!table || !table.active) throw new NotFoundError("La mesa ya no está disponible.");
    if (["RESERVED", "BLOCKED", "TO_CLEAN"].includes(table.status)) throw new ConflictError("Esta mesa no puede abrirse en su estado actual.");

    const products = await tx.product.findMany({
      where: { id: { in: input.items.map(item => item.productId) }, active: true },
      include: { station: true }
    });
    if (products.length !== new Set(input.items.map(item => item.productId)).size) throw new ValidationError("Uno de los productos ya no existe.");
    const unavailable = products.find(product => !["AVAILABLE", "LOW_STOCK"].includes(product.availability));
    if (unavailable) throw new ConflictError(`${unavailable.name} ya no está disponible.`);

    let tableSession = await tx.tableSession.findFirst({ where: { tableId: table.id, status: "OPEN" }, orderBy: { openedAt: "desc" } });
    if (!tableSession) {
      tableSession = await tx.tableSession.create({ data: { tableId: table.id, waiterId: actorId, guestCount: input.guestCount } });
    }

    let order = await tx.order.findFirst({
      where: { tableSessionId: tableSession.id, status: { in: [...activeOrderStatuses] } },
      orderBy: { openedAt: "desc" }
    });

    if (!order) {
      order = await tx.order.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          type: "DINE_IN",
          status: "SENT",
          priority: input.priority ?? "NORMAL",
          tableId: table.id,
          tableSessionId: tableSession.id,
          waiterId: actorId,
          guestCount: input.guestCount,
          notes: input.notes,
          confirmedAt: new Date(),
          sentAt: new Date()
        }
      });
    } else if (["DELIVERED", "PENDING_PAYMENT"].includes(order.status)) {
      order = await tx.order.update({ where: { id: order.id }, data: { status: "SENT", sentAt: new Date(), requestedBillAt: null, version: { increment: 1 } } });
    }

    let addedTotal = new Prisma.Decimal(0);
    const stations = new Set<string>();
    for (const requested of input.items) {
      const product = products.find(candidate => candidate.id === requested.productId)!;
      if (product.stationId) stations.add(product.stationId);
      const modifierTotal = (requested.modifiers ?? []).reduce((sum, modifier) => sum + (modifier.priceDelta ?? 0), 0);
      const unitPrice = product.price.plus(modifierTotal);
      const total = unitPrice.mul(requested.quantity);
      addedTotal = addedTotal.plus(total);
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          quantity: requested.quantity,
          unitPrice,
          total,
          notes: requested.notes,
          modifiers: { create: (requested.modifiers ?? []).map(modifier => ({ name: modifier.name, priceDelta: modifier.priceDelta ?? 0 })) }
        }
      });
    }

    const settings = await tx.restaurantSettings.findUnique({ where: { id: "singleton" } });
    const subtotal = order.subtotal.plus(addedTotal);
    const taxRate = settings?.igvRate ?? new Prisma.Decimal(18);
    const tax = settings?.pricesIncludeTax !== false ? subtotal.mul(taxRate).div(new Prisma.Decimal(100).plus(taxRate)) : subtotal.mul(taxRate).div(100);
    const total = settings?.pricesIncludeTax !== false ? subtotal.minus(order.discount) : subtotal.plus(tax).minus(order.discount);

    order = await tx.order.update({
      where: { id: order.id },
      data: { subtotal, tax, total, status: "SENT", sentAt: order.sentAt ?? new Date(), version: { increment: 1 } }
    });
    for (const stationId of stations) {
      await tx.kitchenTicket.upsert({
        where: { orderId_stationId: { orderId: order.id, stationId } },
        update: { status: "NEW", sentAt: new Date(), startedAt: null, readyAt: null },
        create: { orderId: order.id, stationId }
      });
    }
    await tx.restaurantTable.update({ where: { id: table.id }, data: { status: "SENT", version: { increment: 1 } } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, actorId, fromStatus: null, toStatus: "SENT", device } });
    await tx.idempotencyOperation.upsert({
      where: { scope_key: { scope: "ORDER_SUBMIT", key: input.idempotencyKey } },
      update: { resultId: order.id },
      create: { scope: "ORDER_SUBMIT", key: input.idempotencyKey, resultId: order.id, expiresAt: new Date(Date.now() + 86_400_000) }
    });
    await recordAudit(tx, { userId: actorId, action: "ORDER_SENT", module: "orders", entity: "Order", entityId: order.id, after: { total: total.toNumber(), itemCount: input.items.length }, metadata: { table: table.number } });
    return order.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await publishRealtimeEvent({ resource: "orders", action: "created", id: result });
  await publishRealtimeEvent({ resource: "tables", action: "status_changed", id: input.tableId });
  return getOrder(result);
}

export async function getOrder(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: { table: true, waiter: true, items: { include: { modifiers: true, product: { include: { station: true } } } }, tickets: { include: { station: true } } }
  });
  if (!order) throw new NotFoundError("Pedido no encontrado.");
  return order;
}

export async function updateOrderStatus(orderId: string, action: "start" | "deliver" | "request_bill" | "cancel", actorId: string, device?: string) {
  const orderIdResult = await db.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { table: true } });
    if (!order) throw new NotFoundError("Pedido no encontrado.");
    const before = order.status;
    let status: "PREPARING" | "DELIVERED" | "PENDING_PAYMENT" | "CANCELLED";
    let tableStatus: "PREPARING" | "OCCUPIED" | "PENDING_PAYMENT" | "FREE";
    const dates: Record<string, Date> = {};
    if (action === "start") {
      if (!["SENT", "RECEIVED"].includes(order.status)) throw new ConflictError("El pedido ya fue iniciado.");
      status = "PREPARING"; tableStatus = "PREPARING"; dates.startedAt = new Date();
      await tx.orderItem.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "PREPARING", startedAt: new Date() } });
      await tx.kitchenTicket.updateMany({ where: { orderId, status: "NEW" }, data: { status: "PREPARING", startedAt: new Date() } });
    } else if (action === "deliver") {
      if (order.status !== "READY") throw new ConflictError("El pedido aún no está completamente listo.");
      status = "DELIVERED"; tableStatus = "OCCUPIED"; dates.deliveredAt = new Date();
      await tx.orderItem.updateMany({ where: { orderId, status: "READY" }, data: { status: "DELIVERED", deliveredAt: new Date() } });
      await tx.kitchenTicket.updateMany({ where: { orderId, status: "READY" }, data: { status: "DELIVERED", deliveredAt: new Date() } });
    } else if (action === "request_bill") {
      if (!(["DELIVERED", "READY"] as string[]).includes(order.status)) throw new ConflictError("Entrega el pedido antes de solicitar la cuenta.");
      status = "PENDING_PAYMENT"; tableStatus = "PENDING_PAYMENT"; dates.requestedBillAt = new Date();
    } else {
      if (order.status === "PAID") throw new ConflictError("Un pedido pagado no puede cancelarse.");
      status = "CANCELLED"; tableStatus = "FREE"; dates.cancelledAt = new Date();
    }
    await tx.order.update({ where: { id: orderId }, data: { status, ...dates, version: { increment: 1 } } });
    if (order.tableId) await tx.restaurantTable.update({ where: { id: order.tableId }, data: { status: tableStatus, version: { increment: 1 } } });
    await tx.orderStatusHistory.create({ data: { orderId, actorId, fromStatus: before, toStatus: status, device } });
    await recordAudit(tx, { userId: actorId, action: `ORDER_${status}`, module: "orders", entity: "Order", entityId: orderId, before: { status: before }, after: { status } });
    return order.id;
  });
  await publishRealtimeEvent({ resource: "orders", action: "status_changed", id: orderIdResult });
  await publishRealtimeEvent({ resource: "tables", action: "updated" });
  return getOrder(orderIdResult);
}

export async function markOrderItemReady(orderId: string, itemId: string, actorId: string) {
  await db.$transaction(async tx => {
    const item = await tx.orderItem.findFirst({ where: { id: itemId, orderId }, include: { order: true, product: true } });
    if (!item) throw new NotFoundError("Producto del pedido no encontrado.");
    if (item.status === "READY" || item.status === "DELIVERED") return;
    await tx.orderItem.update({ where: { id: itemId }, data: { status: "READY", readyAt: new Date() } });
    const remaining = await tx.orderItem.count({ where: { orderId, status: { notIn: ["READY", "DELIVERED", "CANCELLED"] } } });
    const newStatus = remaining === 0 ? "READY" : "PARTIALLY_READY";
    await tx.order.update({ where: { id: orderId }, data: { status: newStatus, readyAt: remaining === 0 ? new Date() : undefined, version: { increment: 1 } } });
    if (item.order.tableId) await tx.restaurantTable.update({ where: { id: item.order.tableId }, data: { status: newStatus, version: { increment: 1 } } });

    if (item.product.stationId) {
      const stationRemaining = await tx.orderItem.count({ where: { orderId, product: { stationId: item.product.stationId }, status: { notIn: ["READY", "DELIVERED", "CANCELLED"] } } });
      await tx.kitchenTicket.update({ where: { orderId_stationId: { orderId, stationId: item.product.stationId } }, data: { status: stationRemaining === 0 ? "READY" : "PARTIALLY_READY", readyAt: stationRemaining === 0 ? new Date() : undefined } });
    }
    if (remaining === 0) {
      await tx.notification.create({ data: { userId: item.order.waiterId, orderId, title: `Pedido #${item.order.number} listo`, message: "El pedido está listo para entregar.", level: "IMPORTANT" } });
    }
    await recordAudit(tx, { userId: actorId, action: "ORDER_ITEM_READY", module: "kitchen", entity: "OrderItem", entityId: itemId, before: { status: item.status }, after: { status: "READY" } });
  });
  await publishRealtimeEvent({ resource: "orders", action: "status_changed", id: orderId });
  await publishRealtimeEvent({ resource: "notifications", action: "created" });
  return getOrder(orderId);
}
