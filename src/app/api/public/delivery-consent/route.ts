import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/../generated/prisma/client";
import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";

const schema = z.object({
  token: z.string().min(40).max(100).regex(/^[A-Za-z0-9_-]+$/),
  action: z.enum(["inspect", "confirm", "decline"])
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await readJson(request));
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const ip = request.headers.get("x-real-ip") ?? "unknown";
    await Promise.all([
      rateLimit(`delivery-consent-ip:${ip}`, 20, 60_000),
      rateLimit(`delivery-consent-token:${tokenHash}`, 12, 60_000)
    ]);

    const result = await db.$transaction(async tx => {
      const consent = await tx.deliveryConsent.findUnique({
        where: { tokenHash },
        include: { deliveryOrder: { include: { order: { include: { items: true } } } } }
      });
      if (!consent) throw new NotFoundError("Este enlace no es válido o ya no está disponible.");

      const order = consent.deliveryOrder.order;
      let status = consent.status;
      let transitioned = false;

      if (status === "PENDING" && consent.expiresAt <= new Date()) {
        const updated = await tx.deliveryConsent.updateMany({ where: { id: consent.id, status: "PENDING" }, data: { status: "EXPIRED", tokenHash: randomBytes(32).toString("hex") } });
        if (updated.count) {
          status = "EXPIRED";
          transitioned = true;
          await tx.deliveryOrder.update({ where: { id: consent.deliveryOrderId }, data: { status: "CANCELLED" } });
          if (order.status === "NEW") {
            await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), version: { increment: 1 } } });
            await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: "NEW", toStatus: "CANCELLED", device: "recipient-consent-expired" } });
          }
          await recordAudit(tx, { action: "DELIVERY_RECIPIENT_CONSENT_EXPIRED", module: "delivery", entity: "Order", entityId: order.id, before: { status: "PENDING" }, after: { status: "EXPIRED" }, ip });
        }
      }

      if (input.action !== "inspect" && status === "PENDING") {
        if (input.action === "confirm") {
          const updated = await tx.deliveryConsent.updateMany({ where: { id: consent.id, status: "PENDING", expiresAt: { gt: new Date() } }, data: { status: "CONFIRMED", confirmedAt: new Date(), tokenHash: randomBytes(32).toString("hex") } });
          if (!updated.count) throw new ConflictError("Este enlace venció o ya fue utilizado.");
          if (order.status !== "NEW") throw new ConflictError("El pedido ya no está pendiente de confirmación.");

          const stationIds = [...new Set(order.items.map(item => item.productId))];
          const products = await tx.product.findMany({ where: { id: { in: stationIds } }, select: { stationId: true } });
          const uniqueStations = [...new Set(products.map(product => product.stationId).filter((id): id is string => Boolean(id)))];
          for (const stationId of uniqueStations) {
            await tx.kitchenTicket.create({ data: { orderId: order.id, stationId } });
          }
          await tx.deliveryOrder.update({ where: { id: consent.deliveryOrderId }, data: { status: "CONFIRMED" } });
          await tx.order.update({ where: { id: order.id }, data: { status: "SENT", confirmedAt: new Date(), sentAt: new Date(), version: { increment: 1 } } });
          await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: "NEW", toStatus: "SENT", device: "recipient-consent" } });
          await recordAudit(tx, { action: "DELIVERY_RECIPIENT_CONFIRMED", module: "delivery", entity: "Order", entityId: order.id, before: { status: "NEW" }, after: { status: "SENT" }, ip });
          status = "CONFIRMED";
          transitioned = true;
        } else {
          const updated = await tx.deliveryConsent.updateMany({ where: { id: consent.id, status: "PENDING", expiresAt: { gt: new Date() } }, data: { status: "DECLINED", declinedAt: new Date(), tokenHash: randomBytes(32).toString("hex") } });
          if (!updated.count) throw new ConflictError("Este enlace venció o ya fue utilizado.");
          await tx.deliveryOrder.update({ where: { id: consent.deliveryOrderId }, data: { status: "CANCELLED" } });
          if (order.status === "NEW") {
            await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), version: { increment: 1 } } });
            await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: "NEW", toStatus: "CANCELLED", device: "recipient-consent" } });
          }
          await recordAudit(tx, { action: "DELIVERY_RECIPIENT_DECLINED", module: "delivery", entity: "Order", entityId: order.id, before: { status: "NEW" }, after: { status: "CANCELLED" }, ip });
          status = "DECLINED";
          transitioned = true;
        }
      } else if (input.action !== "inspect" && !transitioned) {
        throw new ConflictError(status === "CONFIRMED" ? "Este pedido ya fue confirmado." : "Este pedido ya no puede confirmarse.");
      }

      return {
        transitioned,
        orderId: order.id,
        consent: {
          status,
          recipientName: consent.recipientName,
          senderName: order.customerName ?? "Un cliente",
          orderNumber: order.number,
          address: order.deliveryAddress,
          reference: order.deliveryReference,
          mapsUrl: consent.deliveryOrder.mapsUrl,
          total: order.total.toString(),
          expiresAt: consent.expiresAt.toISOString()
        }
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (result.transitioned) await publishRealtimeEvent({ resource: "orders", action: "status_changed", id: result.orderId });
    return ok(result.consent);
  } catch (error) {
    return handleApiError(error);
  }
}
