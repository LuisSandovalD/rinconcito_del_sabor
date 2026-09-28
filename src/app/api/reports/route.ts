import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await requirePermission("reports.view");
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : new Date(Date.now() - 6 * 86_400_000);
    from.setHours(0, 0, 0, 0);
    const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : new Date();
    to.setHours(23, 59, 59, 999);
    const [sales, payments, items] = await Promise.all([
      db.sale.findMany({ where: { createdAt: { gte: from, lte: to }, cancelledAt: null }, include: { order: { include: { waiter: true } }, payments: true }, orderBy: { createdAt: "asc" } }),
      db.payment.groupBy({ by: ["method"], where: { createdAt: { gte: from, lte: to }, status: "COMPLETED" }, _sum: { amount: true } }),
      db.orderItem.groupBy({ by: ["productName"], where: { order: { paidAt: { gte: from, lte: to } } }, _sum: { quantity: true, total: true }, orderBy: { _sum: { total: "desc" } }, take: 10 })
    ]);
    const daily = new Map<string, number>();
    for (const sale of sales) { const key = sale.createdAt.toISOString().slice(0, 10); daily.set(key, (daily.get(key) ?? 0) + sale.total.toNumber()); }
    return ok({ total: sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0), count: sales.length, average: sales.length ? sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0) / sales.length : 0, daily: [...daily].map(([date, total]) => ({ date, total })), payments, items, sales: sales.slice(-20).reverse() });
  } catch (error) { return handleApiError(error); }
}
