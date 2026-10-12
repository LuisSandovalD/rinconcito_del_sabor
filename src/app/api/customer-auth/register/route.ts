import argon2 from "argon2";
import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { createCustomerSession } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().transform(value => value.toLowerCase().trim()),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-real-ip") ?? "local";
    await rateLimit(`customer-register:${ip}`, 5, 60 * 60_000);
    const input = schema.parse(await readJson(request));
    const exists = await db.customer.findFirst({ where: { OR: [{ email: input.email }, { phone: input.phone }] }, select: { id: true } });
    if (exists) throw new ConflictError("Ya existe una cuenta con ese correo o teléfono.");
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const customer = await db.$transaction(async tx => {
      const row = await tx.customer.create({ data: { name: input.name, email: input.email, phone: input.phone, passwordHash } });
      await tx.auditLog.create({ data: { action: "CUSTOMER_REGISTERED", module: "security", entity: "Customer", entityId: row.id, ip } });
      return row;
    });
    await createCustomerSession(customer.id);
    return ok({ id: customer.id, name: customer.name, firstName: customer.name.split(/\s+/)[0], email: customer.email, phone: customer.phone }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
