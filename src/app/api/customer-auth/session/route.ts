import { getCurrentCustomer } from "@/lib/customer-auth";
import { ok } from "@/lib/api";

export async function GET() {
  return ok(await getCurrentCustomer());
}
