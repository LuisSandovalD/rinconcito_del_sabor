import { assertSameOrigin, handleApiError, ok } from "@/lib/api";
import { revokeCurrentSession } from "@/lib/auth";
import { revokeCustomerSession } from "@/lib/customer-auth";

export async function POST(request: Request) {
  try { assertSameOrigin(request); await Promise.all([revokeCurrentSession(), revokeCustomerSession()]); return ok({ success: true }); }
  catch (error) { return handleApiError(error); }
}
