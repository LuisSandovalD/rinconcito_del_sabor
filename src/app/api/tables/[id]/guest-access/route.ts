import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/../generated/prisma/client";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { recordAudit } from "@/services/audit.service";

const schema = z.object({ guestCount: z.number().int().min(1).max(50).default(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("orders.create");
    const input = schema.parse(await readJson(request));
    const { id } = await params;
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 8 * 60 * 60_000);

    const result = await db.$transaction(async tx => {
      const settings = await tx.restaurantSettings.findUnique({ where: { id: "singleton" }, select: { qrOrderingEnabled: true } });
      if (!settings?.qrOrderingEnabled) throw new ConflictError("Activa los pedidos desde QR antes de habilitar una mesa.");
      const table = await tx.restaurantTable.findUnique({ where: { id }, select: { id: true, number: true, active: true, status: true } });
      if (!table || !table.active) throw new NotFoundError("Mesa no encontrada.");
      if (["BLOCKED", "RESERVED", "TO_CLEAN"].includes(table.status)) throw new ConflictError("La mesa no se puede habilitar en su estado actual.");
      let session = await tx.tableSession.findFirst({ where: { tableId: table.id, status: "OPEN" }, orderBy: { openedAt: "desc" } });
      if (!session) session = await tx.tableSession.create({ data: { tableId: table.id, waiterId: user.id, guestCount: input.guestCount } });
      session = await tx.tableSession.update({ where: { id: session.id }, data: { guestTokenHash: tokenHash, guestTokenExpiresAt: expiresAt, guestOrderingEnabled: true, waiterId: session.waiterId ?? user.id, guestCount: input.guestCount } });
      if (table.status === "FREE") await tx.restaurantTable.update({ where: { id: table.id }, data: { status: "OCCUPIED", version: { increment: 1 } } });
      await recordAudit(tx, { userId: user.id, action: "TABLE_GUEST_ACCESS_ROTATED", module: "security", entity: "TableSession", entityId: session.id, metadata: { tableNumber: table.number, expiresAt: expiresAt.toISOString() } });
      return { tableNumber: table.number, expiresAt };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return ok({ ...result, accessToken: token });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("orders.create");
    await readJson(request);
    const { id } = await params;
    await db.$transaction(async tx => {
      const session = await tx.tableSession.findFirst({ where: { tableId: id, status: "OPEN" }, orderBy: { openedAt: "desc" } });
      if (!session) return;
      await tx.tableSession.update({ where: { id: session.id }, data: { guestOrderingEnabled: false, guestTokenHash: null, guestTokenExpiresAt: null } });
      await recordAudit(tx, { userId: user.id, action: "TABLE_GUEST_ACCESS_REVOKED", module: "security", entity: "TableSession", entityId: session.id });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
