import { createHash } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/services/audit.service";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    rateLimit(`reset:${ip}`, 8, 15 * 60_000);
    const input = z.object({ token: z.string().min(20), password: z.string().min(12).regex(/[A-Z]/, "Incluye una mayúscula").regex(/[0-9]/, "Incluye un número") }).parse(await readJson(request));
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const reset = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) throw new ValidationError("El enlace venció o ya fue utilizado.");
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    await db.$transaction(async tx => {
      await tx.user.update({ where: { id: reset.userId }, data: { passwordHash, failedLogins: 0, lockedUntil: null } });
      await tx.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
      await tx.session.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await recordAudit(tx, { userId: reset.userId, action: "PASSWORD_RESET_COMPLETED", module: "security", entity: "User", entityId: reset.userId, ip });
    });
    return ok({ success: true });
  } catch (error) { return handleApiError(error); }
}
