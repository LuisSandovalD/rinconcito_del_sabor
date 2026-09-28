import { z } from "zod";
import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10)
}).refine(value => !value.from || !value.to || value.from <= value.to, {
  message: "La fecha inicial no puede ser posterior a la fecha final."
});

function limaDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

function subtractDays(date: string, days: number) {
  return limaDate(new Date(new Date(`${date}T12:00:00-05:00`).getTime() - days * 86_400_000));
}

export async function GET(request: Request) {
  try {
    await requirePermission("reports.view");
    const url = new URL(request.url);
    const input = querySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const today = limaDate(new Date());
    const toDate = input.to ?? today;
    const fromDate = input.from ?? subtractDays(toDate, 6);
    if (fromDate > toDate) throw new Error("La fecha inicial no puede ser posterior a la fecha final.");

    const from = new Date(`${fromDate}T00:00:00.000-05:00`);
    const to = new Date(`${toDate}T23:59:59.999-05:00`);
    const where = { createdAt: { gte: from, lte: to }, cancelledAt: null as Date | null };

    const [metricSales, payments, items, totalSales, sales] = await Promise.all([
      db.sale.findMany({
        where,
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" }
      }),
      db.payment.groupBy({
        by: ["method"],
        where: { createdAt: { gte: from, lte: to }, status: "COMPLETED" },
        _sum: { amount: true }
      }),
      db.orderItem.groupBy({
        by: ["productName"],
        where: { order: { paidAt: { gte: from, lte: to } } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 10
      }),
      db.sale.count({ where }),
      db.sale.findMany({
        where,
        include: { order: { include: { waiter: true } }, payments: true },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      })
    ]);

    const daily = new Map<string, number>();
    for (const sale of metricSales) {
      const key = limaDate(sale.createdAt);
      daily.set(key, (daily.get(key) ?? 0) + sale.total.toNumber());
    }

    const total = metricSales.reduce((sum, sale) => sum + sale.total.toNumber(), 0);
    const totalPages = Math.max(1, Math.ceil(totalSales / input.pageSize));

    return ok({
      total,
      count: totalSales,
      average: totalSales ? total / totalSales : 0,
      daily: [...daily].map(([date, value]) => ({ date, total: value })),
      payments,
      items,
      sales,
      range: {
        from: fromDate,
        to: toDate,
        page: Math.min(input.page, totalPages),
        pageSize: input.pageSize,
        totalPages,
        totalSales
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
