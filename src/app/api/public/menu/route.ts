import { handleApiError, ok } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [settings, categories] = await Promise.all([
      db.restaurantSettings.findUniqueOrThrow({
        where: { id: "singleton" },
        select: { tradeName: true, address: true, phone: true, logoUrl: true, qrOrderingEnabled: true }
      }),
      db.category.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          products: {
            where: { active: true },
            orderBy: [{ featured: "desc" }, { name: "asc" }],
            select: { id: true, name: true, description: true, price: true, imageUrl: true, estimatedMinutes: true, availability: true, featured: true }
          }
        }
      })
    ]);
    const { qrOrderingEnabled, ...publicSettings } = settings;
    return ok({ settings: { ...publicSettings, orderingEnabled: qrOrderingEnabled }, categories });
  } catch (error) {
    return handleApiError(error);
  }
}
