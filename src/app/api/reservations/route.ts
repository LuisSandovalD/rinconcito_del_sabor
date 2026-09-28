import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";

const schema = z.object({ customerName: z.string().trim().min(2).max(100), phone: z.string().trim().min(6).max(30), partySize: z.number().int().min(1).max(50), reservedFor: z.iso.datetime(), tableId: z.string().nullable().optional(), notes: z.string().max(300).optional() });
export async function GET() { try { await requirePermission("reservations.view"); return ok(await db.reservation.findMany({ where: { reservedFor: { gte: new Date(Date.now() - 86_400_000) } }, include: { table: { include: { zone: true } } }, orderBy: { reservedFor: "asc" }, take: 100 })); } catch (error) { return handleApiError(error); } }
export async function POST(request: Request) { try { const user = await requirePermission("reservations.manage"); const input = schema.parse(await readJson(request)); const reservation = await db.$transaction(async tx => { const row = await tx.reservation.create({ data: { ...input, reservedFor: new Date(input.reservedFor) } }); if (input.tableId) await tx.restaurantTable.update({ where: { id: input.tableId }, data: { status: "RESERVED" } }); await recordAudit(tx, { userId: user.id, action: "RESERVATION_CREATED", module: "reservations", entity: "Reservation", entityId: row.id, after: { customerName: row.customerName, reservedFor: row.reservedFor.toISOString() } }); return row; }); await publishRealtimeEvent({ resource: "reservations", action: "created", id: reservation.id }); await publishRealtimeEvent({ resource: "tables", action: "updated", id: input.tableId ?? undefined }); return ok(reservation, { status: 201 }); } catch (error) { return handleApiError(error); } }
