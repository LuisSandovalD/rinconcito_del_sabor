import { createHash, randomBytes } from "node:crypto";
import "dotenv/config";
import { db } from "../../src/lib/db";
import { createOrExtendOrder } from "../../src/services/orders.service";

const suffix = randomBytes(8).toString("hex");
const tokenHash = createHash("sha256").update(randomBytes(32)).digest("hex");
const settings = await db.restaurantSettings.findUnique({ where: { id: "singleton" } });
const previousQrSetting = settings?.qrOrderingEnabled;
if (settings) await db.restaurantSettings.update({ where: { id: "singleton" }, data: { qrOrderingEnabled: true } });
else await db.restaurantSettings.create({ data: { id: "singleton", legalName: "QR Direct Test", tradeName: "QR Direct Test", qrOrderingEnabled: true } });

const highestTable = await db.restaurantTable.aggregate({ _max: { number: true } });
const zone = await db.zone.create({ data: { name: `QR Direct Zone ${suffix}` } });
const station = await db.station.create({ data: { name: `QR Direct Station ${suffix}` } });
const category = await db.category.create({ data: { name: `QR Direct Category ${suffix}` } });
const product = await db.product.create({ data: { name: `QR Direct Product ${suffix}`, slug: `qr-direct-${suffix}`, price: 25, categoryId: category.id, stationId: station.id } });
const table = await db.restaurantTable.create({
  data: {
    number: (highestTable._max.number ?? 0) + 10_000,
    capacity: 4,
    zoneId: zone.id,
    physicalQrTokenHash: tokenHash,
    physicalQrOrderingEnabled: true,
    physicalQrRotatedAt: new Date()
  }
});

let orderId: string | undefined;
try {
  const order = await createOrExtendOrder({
    idempotencyKey: crypto.randomUUID(),
    tableId: table.id,
    guestCount: 2,
    guestTokenHash: tokenHash,
    items: [{ productId: product.id, quantity: 1 }]
  }, undefined, "direct-qr-e2e");
  orderId = order.id;
  const persisted = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { tickets: true, table: true } });
  if (persisted.status !== "SENT" || persisted.tickets.length !== 1 || persisted.tickets[0]?.stationId !== station.id || persisted.table?.status !== "SENT") {
    throw new Error(`El pedido QR no llegó directamente a cocina: ${JSON.stringify({ status: persisted.status, tickets: persisted.tickets.length, tableStatus: persisted.table?.status })}`);
  }
  console.log(JSON.stringify({ status: persisted.status, tickets: persisted.tickets.length, tableStatus: persisted.table?.status }));
} finally {
  if (orderId) await db.order.deleteMany({ where: { id: orderId } });
  await db.tableSession.deleteMany({ where: { tableId: table.id } });
  await db.restaurantTable.delete({ where: { id: table.id } });
  await db.product.delete({ where: { id: product.id } });
  await db.category.delete({ where: { id: category.id } });
  await db.station.delete({ where: { id: station.id } });
  await db.zone.delete({ where: { id: zone.id } });
  if (settings) await db.restaurantSettings.update({ where: { id: "singleton" }, data: { qrOrderingEnabled: previousQrSetting } });
  else await db.restaurantSettings.delete({ where: { id: "singleton" } });
  await db.$disconnect();
}
