import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requirePermission("tables.view");
    const zones = await db.zone.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        tables: {
          where: { active: true },
          orderBy: { number: "asc" },
          include: {
            orders: {
              where: { status: { notIn: ["PAID", "CANCELLED", "VOIDED"] } },
              orderBy: { openedAt: "desc" },
              take: 1,
              include: { waiter: true, items: true }
            },
            tableSessions: { where: { status: "OPEN" }, orderBy: { openedAt: "desc" }, take: 1 }
          }
        }
      }
    });
    return ok(zones);
  } catch (error) { return handleApiError(error); }
}
