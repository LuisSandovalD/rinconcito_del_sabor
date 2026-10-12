import { assertSameOrigin, ok } from "@/lib/api";
import { revokeCustomerSession } from "@/lib/customer-auth";
import { revokeCurrentSession } from "@/lib/auth";

export async function POST(request: Request) {
  assertSameOrigin(request);
  await Promise.all([revokeCustomerSession(), revokeCurrentSession()]);
  return ok({ success: true });
}
