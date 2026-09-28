import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function GET() { return ok(await getCurrentUser()); }
