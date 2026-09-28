import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";

const schema = z.object({ tradeName: z.string().min(2).max(120), legalName: z.string().min(2).max(160), ruc: z.string().max(20).nullable().optional(), address: z.string().max(240).nullable().optional(), phone: z.string().max(30).nullable().optional(), email: z.email().nullable().optional(), igvRate: z.number().min(0).max(100), pricesIncludeTax: z.boolean(), soundEnabled: z.boolean(), qrOrderingEnabled: z.boolean(), waiterApprovalRequired: z.boolean() });
export async function GET() { try { await requirePermission("settings.view"); return ok(await db.restaurantSettings.findUniqueOrThrow({ where: { id: "singleton" } })); } catch (error) { return handleApiError(error); } }
export async function PATCH(request: Request) { try { const user = await requirePermission("settings.update"); const input = schema.parse(await readJson(request)); const before = await db.restaurantSettings.findUniqueOrThrow({ where: { id: "singleton" } }); const result = await db.$transaction(async tx => { const row = await tx.restaurantSettings.update({ where: { id: "singleton" }, data: input }); await recordAudit(tx, { userId: user.id, action: "SETTINGS_UPDATED", module: "settings", entity: "RestaurantSettings", entityId: "singleton", before: { tradeName: before.tradeName, igvRate: before.igvRate.toNumber() }, after: { tradeName: row.tradeName, igvRate: row.igvRate.toNumber() } }); return row; }); await publishRealtimeEvent({ resource: "settings", action: "updated" }); return ok(result); } catch (error) { return handleApiError(error); } }
