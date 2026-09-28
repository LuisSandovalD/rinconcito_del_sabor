import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { handleApiError, ok, readJson } from "@/lib/api";
import { AuthenticationError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.email().transform(value => value.toLowerCase().trim()), password: z.string().min(8) });

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    rateLimit(`login:${ip}`, 8, 60_000);
    const input = schema.parse(await readJson(request));
    const user = await db.user.findUnique({ where: { email: input.email }, include: { roles: { include: { role: true } } } });
    if (!user || user.status !== "ACTIVE" || !(await argon2.verify(user.passwordHash, input.password))) {
      if (user) await db.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } } });
      throw new AuthenticationError("El correo o la contraseña no son correctos.");
    }
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lastLoginAt: new Date() } });
    await createSession(user.id);
    return ok({ name: `${user.firstName} ${user.lastName}`, role: user.roles[0]?.role.name ?? "" });
  } catch (error) { return handleApiError(error); }
}
