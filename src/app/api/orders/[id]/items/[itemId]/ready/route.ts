import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { markOrderItemReady } from "@/services/orders.service";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const user = await requirePermission("kitchen.complete");
    const { id, itemId } = await context.params;
    return ok(await markOrderItemReady(id, itemId, user.id));
  } catch (error) { return handleApiError(error); }
}
