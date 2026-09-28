import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { emailService } from "@/services/email/brevo.service";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    rateLimit(`forgot:${ip}`, 5, 15 * 60_000);
    const { email } = z.object({ email: z.email().transform(value => value.toLowerCase().trim()) }).parse(await readJson(request));
    const user = await db.user.findUnique({ where: { email } });
    if (user?.status === "ACTIVE") {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) } });
      void emailService.passwordReset(user.firstName, user.email, token);
      await db.auditLog.create({ data: { userId: user.id, action: "PASSWORD_RESET_REQUESTED", module: "security", entity: "User", entityId: user.id, ip } });
    }
    return ok({ message: "Si el correo está registrado, recibirás un enlace en los próximos minutos." });
  } catch (error) { return handleApiError(error); }
}
