import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { payOrder } from "@/services/payments.service";

const schema = z.object({
  idempotencyKey: z.string().uuid(), orderId: z.string().min(1),
  payments: z.array(z.object({ method: z.enum(["CASH", "YAPE", "PLIN", "CARD", "TRANSFER", "OTHER"]), amount: z.number().positive(), receivedAmount: z.number().positive().optional(), reference: z.string().max(100).optional() })).min(1)
});

export async function POST(request: Request) {
  try {
    const user = await requirePermission("payments.create");
    return ok(await payOrder(schema.parse(await readJson(request)), user.id), { status: 201 });
  } catch (error) { return handleApiError(error); }
}
