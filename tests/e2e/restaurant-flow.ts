export {};

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const password = process.env.E2E_PASSWORD;
if (!password) throw new Error("E2E_PASSWORD is required.");

type JsonResult<T> = { data: T; error?: string };
let cookie = "";

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", origin: baseUrl, ...(cookie ? { cookie } : {}), ...init.headers }
  });
  if (path === "/api/auth/login") cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  const body = await response.json() as JsonResult<T>;
  if (!response.ok) throw new Error(`${path}: ${body.error ?? response.status}`);
  return body.data;
}

const login = await request<{ name: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@rinconcito.pe", password }) });
const zones = await request<Array<{ tables: Array<{ id: string; number: number; status: string }> }>>("/api/tables");
const catalog = await request<{ products: Array<{ id: string; name: string }> }>("/api/products?available=true");
const cash = await request<{ session: { id: string } | null; registers: Array<{ id: string }> }>("/api/cash");
if (!cash.session) await request("/api/cash", { method: "POST", body: JSON.stringify({ action: "open", registerId: cash.registers[0].id, amount: 100, idempotencyKey: crypto.randomUUID() }) });

const table = zones.flatMap(zone => zone.tables).find(item => item.status === "FREE");
const lomo = catalog.products.find(item => item.name === "Lomo saltado");
const lemonade = catalog.products.find(item => item.name === "Limonada frozen");
if (!table || !lomo || !lemonade) throw new Error("Seed data is incomplete.");

const order = await request<{ id: string; number: number; total: string; items: Array<{ id: string }> }>("/api/orders", {
  method: "POST",
  body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), tableId: table.id, guestCount: 2, items: [{ productId: lomo.id, quantity: 1, notes: "Sin cebolla", modifiers: [{ name: "Carne 3/4", priceDelta: 0 }] }, { productId: lemonade.id, quantity: 1 }] })
});
await request(`/api/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ action: "start" }) });
for (const item of order.items) await request(`/api/orders/${order.id}/items/${item.id}/ready`, { method: "PATCH", body: "{}" });
await request(`/api/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ action: "deliver" }) });
await request(`/api/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ action: "request_bill" }) });
const half = Math.round(Number(order.total) * 50) / 100;
const sale = await request<{ payments: unknown[] }>("/api/payments", { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), orderId: order.id, payments: [{ method: "CASH", amount: half, receivedAmount: half }, { method: "YAPE", amount: Number(order.total) - half, reference: "E2E" }] }) });
const finalZones = await request<Array<{ tables: Array<{ id: string; status: string }> }>>("/api/tables");
const finalTable = finalZones.flatMap(zone => zone.tables).find(item => item.id === table.id);
const audits = await request<unknown[]>("/api/audit");
if (finalTable?.status !== "FREE") throw new Error("The table was not released after payment.");
if (sale.payments.length !== 2) throw new Error("Mixed payment was not persisted.");

const reservation = await request<{ id: string }>("/api/reservations", { method: "POST", body: JSON.stringify({ customerName: "Reserva E2E", phone: "999888777", partySize: 3, reservedFor: new Date(Date.now() + 86_400_000).toISOString() }) });
await request(`/api/reservations/${reservation.id}`, { method: "PATCH", body: JSON.stringify({ status: "CONFIRMED" }) });
const external = await request<{ id: string }>("/api/external-orders", { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), type: "TAKEAWAY", customerName: "Recojo E2E", customerPhone: "999111222", items: [{ productId: lemonade.id, quantity: 1 }] }) });
const externalOrders = await request<Array<{ id: string }>>("/api/external-orders");
if (!externalOrders.some(item => item.id === external.id)) throw new Error("External order was not persisted.");

console.info(JSON.stringify({ user: login.name, table: table.number, order: order.number, total: order.total, payments: sale.payments.length, finalTableStatus: finalTable.status, reservation: "CONFIRMED", externalOrder: "SENT", auditEvents: audits.length }, null, 2));
