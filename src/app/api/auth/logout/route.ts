import { handleApiError, ok } from "@/lib/api";
import { revokeCurrentSession } from "@/lib/auth";

export async function POST() {
  try { await revokeCurrentSession(); return ok({ success: true }); }
  catch (error) { return handleApiError(error); }
}
