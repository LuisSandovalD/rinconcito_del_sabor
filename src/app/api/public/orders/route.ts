import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requireCustomer } from "@/lib/customer-auth";
import { rateLimit } from "@/lib/rate-limit";
import { createExternalOrder } from "@/services/external-orders.service";

const publicOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  type: z.enum(["TAKEAWAY", "DELIVERY"]),
  deliveryAddress: z.string().trim().max(240).optional(),
  deliveryReference: z.string().trim().max(240).optional(),
  deliveryLatitude: z.number().min(-90).max(90).optional(),
  deliveryLongitude: z.number().min(-180).max(180).optional(),
  deliveryAccuracy: z.number().positive().max(10_000).optional(),
  recipientType: z.enum(["SELF", "OTHER"]).default("SELF"),
  recipientName: z.string().trim().min(2).max(100).optional(),
  recipientEmail: z.string().trim().email().max(180).optional(),
  recipientPhone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(300).optional(),
  website: z.string().max(0).optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(30),
    notes: z.string().trim().max(200).optional()
  })).min(1).max(40)
}).superRefine((value, context) => {
  if (value.type !== "DELIVERY") return;
  if (!value.deliveryAddress) context.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Ingresa la dirección de entrega." });
  if (value.deliveryLatitude === undefined || value.deliveryLongitude === undefined || value.deliveryAccuracy === undefined) {
    context.addIssue({ code: "custom", path: ["deliveryLatitude"], message: "Comparte tu ubicación exacta." });
  }
  if (value.recipientType === "OTHER" && (!value.recipientName || !value.recipientEmail)) {
    context.addIssue({ code: "custom", path: ["recipientEmail"], message: "Identifica a la persona que recibirá el pedido." });
  }
});

export async function POST(request: Request) {
  try {
    const customer = await requireCustomer();
    const ip = request.headers.get("x-real-ip") ?? "unknown";
    await rateLimit(`public-order-customer:${customer.id}`, 6, 60_000);
    const input = publicOrderSchema.parse(await readJson(request));
    const order = await createExternalOrder({ ...input, customerName: customer.name, customerEmail: customer.email, customerPhone: customer.phone }, {
      source: "STOREFRONT",
      customerId: customer.id,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined
    });

    return ok({
      id: order.id,
      number: order.number,
      status: order.status,
      type: order.type,
      total: order.total.toString(),
      consentPending: order.consentPending,
      consentNotificationDelivered: order.consentNotificationDelivered
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
