import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";
import { db } from "@/lib/db";
import { ConflictError, ValidationError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";
import { emailService } from "@/services/email/brevo.service";

export type ExternalOrderInput = {
  idempotencyKey: string;
  type: "TAKEAWAY" | "DELIVERY";
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryReference?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryAccuracy?: number;
  recipientType?: "SELF" | "OTHER";
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; notes?: string }>;
};

type ExternalOrderContext = {
  actorId?: string;
  customerId?: string;
  source: "BACKOFFICE" | "STOREFRONT";
  ip?: string;
  userAgent?: string;
};

const CONSENT_TTL_MS = 30 * 60_000;
const MAX_LOCATION_ACCURACY_METERS = 250;

export function googleMapsLocationUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export async function createExternalOrder(input: ExternalOrderInput, context: ExternalOrderContext) {
  const recipientType = input.type === "DELIVERY" ? input.recipientType ?? "SELF" : "SELF";
  const isStorefrontDelivery = input.type === "DELIVERY" && context.source === "STOREFRONT";
  const requiresConsent = isStorefrontDelivery && recipientType === "OTHER";

  if (input.type === "DELIVERY" && !input.deliveryAddress?.trim()) {
    throw new ValidationError("Ingresa la dirección de entrega.");
  }
  if (isStorefrontDelivery) {
    if (!Number.isFinite(input.deliveryLatitude) || !Number.isFinite(input.deliveryLongitude) || !Number.isFinite(input.deliveryAccuracy)) {
      throw new ValidationError("Comparte la ubicación exacta del dispositivo para solicitar el delivery.");
    }
    if (input.deliveryLatitude! < -90 || input.deliveryLatitude! > 90 || input.deliveryLongitude! < -180 || input.deliveryLongitude! > 180 || input.deliveryAccuracy! <= 0) {
      throw new ValidationError("La ubicación recibida no es válida.");
    }
    if (input.deliveryAccuracy! > MAX_LOCATION_ACCURACY_METERS) {
      throw new ValidationError("La ubicación no es suficientemente precisa. Activa la ubicación exacta e inténtalo al aire libre o cerca de una ventana.");
    }
  }
  if (requiresConsent) {
    if (!input.recipientName?.trim() || !input.recipientEmail?.trim()) {
      throw new ValidationError("Ingresa el nombre y correo de la persona que recibirá el pedido.");
    }
    if (input.customerEmail && input.recipientEmail.toLowerCase() === input.customerEmail.toLowerCase()) {
      throw new ValidationError("El correo del destinatario debe pertenecer a la persona que recibirá el pedido.");
    }
  }

  const consentToken = requiresConsent ? randomBytes(32).toString("base64url") : undefined;
  const consentTokenHash = consentToken ? createHash("sha256").update(consentToken).digest("hex") : undefined;
  const now = new Date();

  const transactionResult = await db.$transaction(async tx => {
    const existing = await tx.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return { orderId: existing.id, created: false };

    const productIds = [...new Set(input.items.map(item => item.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { station: true }
    });

    if (products.length !== productIds.length) throw new ValidationError("Uno de los productos ya no existe.");
    const unavailable = products.find(product => !["AVAILABLE", "LOW_STOCK"].includes(product.availability));
    if (unavailable) throw new ConflictError(`${unavailable.name} ya no está disponible.`);

    const settings = await tx.restaurantSettings.findUniqueOrThrow({ where: { id: "singleton" } });
    let subtotal = new Prisma.Decimal(0);
    for (const item of input.items) {
      const product = products.find(row => row.id === item.productId)!;
      subtotal = subtotal.plus(product.price.mul(item.quantity));
    }

    const tax = settings.pricesIncludeTax
      ? subtotal.mul(settings.igvRate).div(new Prisma.Decimal(100).plus(settings.igvRate))
      : subtotal.mul(settings.igvRate).div(100);
    const total = settings.pricesIncludeTax ? subtotal : subtotal.plus(tax);
    const initialStatus = requiresConsent ? "NEW" : "SENT";

    const order = await tx.order.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        type: input.type,
        status: initialStatus,
        priority: input.type === "DELIVERY" ? "DELIVERY" : "PICKUP",
        waiterId: context.actorId,
        customerId: context.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.type === "DELIVERY" ? input.deliveryAddress : undefined,
        deliveryReference: input.type === "DELIVERY" ? input.deliveryReference : undefined,
        notes: input.notes,
        subtotal,
        tax,
        total,
        confirmedAt: requiresConsent ? null : now,
        sentAt: requiresConsent ? null : now,
        items: {
          create: input.items.map(item => {
            const product = products.find(row => row.id === item.productId)!;
            return {
              productId: product.id,
              productName: product.name,
              quantity: item.quantity,
              unitPrice: product.price,
              total: product.price.mul(item.quantity),
              notes: item.notes
            };
          })
        }
      }
    });

    if (!requiresConsent) {
      const stationIds = [...new Set(products.map(product => product.stationId).filter((id): id is string => Boolean(id)))];
      await tx.kitchenTicket.createMany({ data: stationIds.map(stationId => ({ orderId: order.id, stationId })) });
    }

    if (input.type === "DELIVERY") {
      const hasLocation = Number.isFinite(input.deliveryLatitude) && Number.isFinite(input.deliveryLongitude);
      await tx.deliveryOrder.create({
        data: {
          orderId: order.id,
          customerId: context.customerId,
          status: requiresConsent ? "RECEIVED" : "CONFIRMED",
          recipientType,
          latitude: hasLocation ? input.deliveryLatitude : undefined,
          longitude: hasLocation ? input.deliveryLongitude : undefined,
          accuracy: Number.isFinite(input.deliveryAccuracy) ? input.deliveryAccuracy : undefined,
          mapsUrl: hasLocation ? googleMapsLocationUrl(input.deliveryLatitude!, input.deliveryLongitude!) : undefined,
          consent: requiresConsent ? {
            create: {
              tokenHash: consentTokenHash!,
              recipientName: input.recipientName!.trim(),
              recipientEmail: input.recipientEmail!.trim().toLowerCase(),
              recipientPhone: input.recipientPhone?.trim() || undefined,
              expiresAt: new Date(now.getTime() + CONSENT_TTL_MS)
            }
          } : undefined
        }
      });
    }

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, actorId: context.actorId, toStatus: initialStatus, device: context.userAgent }
    });
    await recordAudit(tx, {
      userId: context.actorId,
      action: requiresConsent ? "DELIVERY_AWAITING_RECIPIENT_CONSENT" : context.source === "STOREFRONT" ? "PUBLIC_ORDER_CREATED" : "EXTERNAL_ORDER_CREATED",
      module: "delivery",
      entity: "Order",
      entityId: order.id,
      after: { type: order.type, total: total.toNumber(), customer: input.customerName, recipientType },
      metadata: { source: context.source, locationAccuracy: input.deliveryAccuracy },
      ip: context.ip,
      userAgent: context.userAgent
    });
    return { orderId: order.id, created: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  let consentNotificationDelivered: boolean | undefined;
  if (transactionResult.created && requiresConsent && consentToken) {
    const notification = await emailService.deliveryConsent({
      recipientName: input.recipientName!,
      recipientEmail: input.recipientEmail!,
      senderName: input.customerName,
      consentToken
    });
    consentNotificationDelivered = notification.delivered;
  }

  await publishRealtimeEvent({ resource: "orders", action: "created", id: transactionResult.orderId });
  const order = await db.order.findUniqueOrThrow({
    where: { id: transactionResult.orderId },
    include: { items: true, delivery: { include: { consent: { select: { status: true } } } } }
  });
  let consentPending = false;
  let delivery = null;
  if (order.delivery) {
    const { consent, ...safeDelivery } = order.delivery;
    consentPending = consent?.status === "PENDING";
    delivery = safeDelivery;
  }
  return { ...order, delivery, consentPending, consentNotificationDelivered };
}
