import argon2 from "argon2";
import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { createSession, revokeCurrentSession } from "@/lib/auth";
import { createCustomerSession, revokeCustomerSession } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { AuthenticationError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$ee5cjtfUSiZ4eHgiOTj3YA$U1F9wYwwCpmfGZ/fmhtSv391imBC9nZbibce7JNet0U";
const schema = z.object({ email: z.email().transform(value => value.toLowerCase().trim()), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-real-ip") ?? "local";
    await rateLimit(`unified-login-ip:${ip}`, 10, 15 * 60_000);
    const input = schema.parse(await readJson(request));
    const [staff, customer] = await Promise.all([
      db.user.findUnique({ where: { email: input.email }, include: { roles: { include: { role: true } } } }),
      db.customer.findUnique({ where: { email: input.email } })
    ]);
    if (staff) await rateLimit(`unified-login-staff:${staff.id}`, 8, 15 * 60_000);
    if (customer) await rateLimit(`unified-login-customer:${customer.id}`, 8, 15 * 60_000);

    const [staffPasswordValid, customerPasswordValid] = await Promise.all([
      argon2.verify(staff?.passwordHash ?? DUMMY_HASH, input.password),
      argon2.verify(customer?.passwordHash ?? DUMMY_HASH, input.password)
    ]);
    const now = new Date();
    const staffValid = Boolean(staff && staff.status === "ACTIVE" && staffPasswordValid && (!staff.lockedUntil || staff.lockedUntil <= now));
    const customerValid = Boolean(customer && customer.status === "ACTIVE" && customer.passwordHash && customerPasswordValid && (!customer.lockedUntil || customer.lockedUntil <= now));

    if (staffValid && staff) {
      await db.user.update({ where: { id: staff.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now } });
      await revokeCustomerSession();
      await createSession(staff.id);
      return ok({ kind: "staff" as const, role: staff.roles[0]?.role.name ?? "", name: `${staff.firstName} ${staff.lastName}` });
    }
    if (customerValid && customer) {
      await db.customer.update({ where: { id: customer.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now } });
      await revokeCurrentSession();
      await createCustomerSession(customer.id);
      return ok({ kind: "customer" as const, name: customer.name });
    }

    await Promise.all([
      staff && (!staff.lockedUntil || staff.lockedUntil <= now) ? db.user.update({ where: { id: staff.id }, data: { failedLogins: { increment: 1 }, lockedUntil: staff.failedLogins + 1 >= 5 ? new Date(Date.now() + 15 * 60_000) : null } }) : null,
      customer && (!customer.lockedUntil || customer.lockedUntil <= now) ? db.customer.update({ where: { id: customer.id }, data: { failedLogins: { increment: 1 }, lockedUntil: customer.failedLogins + 1 >= 5 ? new Date(Date.now() + 15 * 60_000) : null } }) : null
    ]);
    throw new AuthenticationError("El correo o la contraseña no son correctos.");
  } catch (error) {
    return handleApiError(error);
  }
}
