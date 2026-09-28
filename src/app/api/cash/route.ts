import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";
import { Prisma } from "../../../../generated/prisma/client";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open"), registerId: z.string().min(1), amount: z.number().min(0), idempotencyKey: z.string().uuid() }),
  z.object({ action: z.literal("close"), sessionId: z.string().min(1), countedCash: z.number().min(0) }),
  z.object({ action: z.literal("movement"), sessionId: z.string().min(1), type: z.enum(["INCOME", "EXPENSE", "WITHDRAWAL", "DEPOSIT", "ADJUSTMENT"]), amount: z.number().positive(), reason: z.string().min(3).max(200), idempotencyKey: z.string().uuid() })
]);

export async function GET() {
  try {
    const user = await requirePermission("cash.view");
    const [registers, session] = await Promise.all([
      db.cashRegister.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      db.cashSession.findFirst({ where: { userId: user.id, status: "OPEN" }, include: { register: true, movements: { orderBy: { createdAt: "desc" }, take: 30 }, payments: true }, orderBy: { openedAt: "desc" } })
    ]);
    const totals = session ? session.movements.reduce<Record<string, number>>((acc, item) => { acc[item.type] = (acc[item.type] ?? 0) + item.amount.toNumber(); return acc; }, {}) : {};
    return ok({ registers, session, totals });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const input = schema.parse(await readJson(request));
    const user = await requirePermission(input.action === "open" ? "cash.open" : input.action === "close" ? "cash.close" : "cash.adjust");
    let result;
    if (input.action === "open") {
      const previous = await db.cashSession.findFirst({ where: { userId: user.id, status: "OPEN" } });
      if (previous) throw new ConflictError("Ya tienes una caja abierta.");
      result = await db.$transaction(async tx => {
        const session = await tx.cashSession.create({ data: { registerId: input.registerId, userId: user.id, openingAmount: input.amount, idempotencyKey: input.idempotencyKey } });
        await recordAudit(tx, { userId: user.id, action: "CASH_OPENED", module: "cash", entity: "CashSession", entityId: session.id, after: { openingAmount: input.amount } });
        return session;
      });
    } else if (input.action === "movement") {
      const session = await db.cashSession.findFirst({ where: { id: input.sessionId, userId: user.id, status: "OPEN" } });
      if (!session) throw new NotFoundError("La sesión de caja no está disponible.");
      result = await db.$transaction(async tx => {
        const movement = await tx.cashMovement.create({ data: { sessionId: input.sessionId, type: input.type, amount: input.amount, reason: input.reason, idempotencyKey: input.idempotencyKey } });
        await recordAudit(tx, { userId: user.id, action: "CASH_MOVEMENT_CREATED", module: "cash", entity: "CashMovement", entityId: movement.id, after: { type: input.type, amount: input.amount, reason: input.reason } });
        return movement;
      });
    } else {
      const session = await db.cashSession.findFirst({ where: { id: input.sessionId, userId: user.id, status: "OPEN" }, include: { movements: true } });
      if (!session) throw new NotFoundError("La sesión de caja no está disponible.");
      const expected = session.openingAmount.plus(session.movements.reduce((sum, movement) => movement.type === "EXPENSE" || movement.type === "WITHDRAWAL" || movement.type === "REFUND" ? sum.minus(movement.amount) : sum.plus(movement.amount), new Prisma.Decimal(0)));
      result = await db.$transaction(async tx => {
        const closed = await tx.cashSession.update({ where: { id: session.id }, data: { status: "CLOSED", expectedCash: expected, countedCash: input.countedCash, difference: new Prisma.Decimal(input.countedCash).minus(expected), closedAt: new Date() } });
        await recordAudit(tx, { userId: user.id, action: "CASH_CLOSED", module: "cash", entity: "CashSession", entityId: session.id, before: { status: "OPEN" }, after: { expected: expected.toNumber(), counted: input.countedCash, difference: input.countedCash - expected.toNumber() } });
        return closed;
      });
    }
    await publishRealtimeEvent({ resource: "cash", action: "updated", id: result.id });
    return ok(result);
  } catch (error) { return handleApiError(error); }
}
