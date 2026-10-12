import { createHash, randomBytes } from "node:crypto";
import "dotenv/config";
import { db } from "../../src/lib/db";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3130";
const cookieName = process.env.TEST_SESSION_COOKIE ?? "__Host-rinconcito_session";
const suffix = randomBytes(8).toString("hex");
const existingSettings = await db.restaurantSettings.findUnique({ where: { id: "singleton" }, select: { id: true } });
if (!existingSettings) {
  await db.restaurantSettings.create({ data: { id: "singleton", legalName: "QR E2E Restaurant", tradeName: "QR E2E Restaurant" } });
}
const highestTable = await db.restaurantTable.aggregate({ _max: { number: true } });
const testZone = await db.zone.create({ data: { name: `QR E2E Zone ${suffix}`, sortOrder: 99_999 } });
const testTable = await db.restaurantTable.create({ data: { number: (highestTable._max.number ?? 0) + 10_000, capacity: 4, zoneId: testZone.id } });
const permission = await db.permission.upsert({
  where: { code: "settings.manage" },
  update: {},
  create: { code: "settings.manage", description: "Administrar configuración sensible" }
});
const [adminRole, waiterRole] = await Promise.all([
  db.role.create({ data: { name: `QR_E2E_ADMIN_${suffix}`, permissions: { create: { permissionId: permission.id } } } }),
  db.role.create({ data: { name: `QR_E2E_LIMITED_${suffix}` } })
]);
const [admin, waiter] = await Promise.all([
  db.user.create({ data: { email: `qr-admin-${suffix}@test.invalid`, passwordHash: "not-used", firstName: "QR", lastName: "Admin", roles: { create: { roleId: adminRole.id } } } }),
  db.user.create({ data: { email: `qr-limited-${suffix}@test.invalid`, passwordHash: "not-used", firstName: "QR", lastName: "Limited", roles: { create: { roleId: waiterRole.id } } } })
]);

const adminToken = randomBytes(32).toString("base64url");
const waiterToken = randomBytes(32).toString("base64url");
const expiresAt = new Date(Date.now() + 5 * 60_000);
await Promise.all([
  db.session.create({ data: { userId: admin.id, tokenHash: createHash("sha256").update(adminToken).digest("hex"), expiresAt } }),
  db.session.create({ data: { userId: waiter.id, tokenHash: createHash("sha256").update(waiterToken).digest("hex"), expiresAt } })
]);

try {
  const anonymousApi = await fetch(`${baseUrl}/api/tables/physical-qr`);
  const adminApi = await fetch(`${baseUrl}/api/tables/physical-qr`, { headers: { cookie: `${cookieName}=${adminToken}` } });
  const adminPage = await fetch(`${baseUrl}/settings/qr`, { headers: { cookie: `${cookieName}=${adminToken}` }, redirect: "manual" });
  const waiterApi = await fetch(`${baseUrl}/api/tables/physical-qr`, { headers: { cookie: `${cookieName}=${waiterToken}` } });
  const adminBody = await adminApi.json() as { data?: { tables?: unknown[] } };
  const result = {
    anonymousApi: anonymousApi.status,
    adminApi: adminApi.status,
    adminPage: adminPage.status,
    activeTables: adminBody.data?.tables?.length ?? 0,
    limitedUserApi: waiterApi.status
  };
  if (result.anonymousApi !== 401 || result.adminApi !== 200 || result.adminPage !== 200 || result.limitedUserApi !== 403) {
    throw new Error(`Falló la protección de QR físicos: ${JSON.stringify(result)}`);
  }
  console.log(JSON.stringify(result));
} finally {
  await db.user.deleteMany({ where: { id: { in: [admin.id, waiter.id] } } });
  await db.role.deleteMany({ where: { id: { in: [adminRole.id, waiterRole.id] } } });
  await db.restaurantTable.delete({ where: { id: testTable.id } });
  await db.zone.delete({ where: { id: testZone.id } });
  if (!existingSettings) await db.restaurantSettings.delete({ where: { id: "singleton" } });
  await db.$disconnect();
}
