import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requirePermission("dashboard.view");
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const [tables, activeOrders, sales, topProducts, recentOrders, ingredientRows] = await Promise.all([
      db.restaurantTable.groupBy({ by: ["status"], where: { active: true }, _count: true }),
      db.order.findMany({ where: { status: { in: ["SENT", "RECEIVED", "PREPARING", "PARTIALLY_READY", "READY", "DELIVERED", "PENDING_PAYMENT"] } }, select: { id: true, status: true, sentAt: true } }),
      db.sale.aggregate({ where: { createdAt: { gte: start }, cancelledAt: null }, _sum: { total: true }, _count: true, _avg: { total: true } }),
      db.orderItem.groupBy({ by: ["productName"], where: { order: { paidAt: { gte: start } } }, _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
      db.order.findMany({ where: { openedAt: { gte: start } }, include: { table: true, waiter: true }, orderBy: { openedAt: "desc" }, take: 6 }),
      db.ingredient.findMany({ where: { active: true, minStock: { not: null } }, select: { stock: true, minStock: true } })
    ]);
    const now = Date.now();
    const delayed = activeOrders.filter(order => order.sentAt && now - order.sentAt.getTime() > 20 * 60_000).length;
    const occupied = tables.filter(row => row.status !== "FREE").reduce((sum, row) => sum + row._count, 0);
    const free = tables.find(row => row.status === "FREE")?._count ?? 0;
    return ok({
      sales: sales._sum.total?.toNumber() ?? 0, orders: sales._count, averageTicket: sales._avg.total?.toNumber() ?? 0,
      occupied, free, kitchen: activeOrders.filter(order => ["SENT", "RECEIVED", "PREPARING", "PARTIALLY_READY"].includes(order.status)).length,
      delayed, waitingPayment: activeOrders.filter(order => order.status === "PENDING_PAYMENT").length, lowStock: ingredientRows.filter(item => item.minStock && item.stock.lte(item.minStock)).length, topProducts, recentOrders
    });
  } catch (error) { return handleApiError(error); }
}
