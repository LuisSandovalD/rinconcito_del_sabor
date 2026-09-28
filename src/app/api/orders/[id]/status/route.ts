import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { updateOrderStatus } from "@/services/orders.service";

const schema = z.object({ action: z.enum(["start", "deliver", "request_bill", "cancel"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const input = schema.parse(await readJson(request));
    const permission = input.action === "start" ? "kitchen.start" : input.action === "cancel" ? "orders.cancel" : "orders.update";
    const user = await requirePermission(permission);
    const { id } = await context.params;
    return ok(await updateOrderStatus(id, input.action, user.id, request.headers.get("user-agent") ?? undefined));
  } catch (error) { return handleApiError(error); }
}
