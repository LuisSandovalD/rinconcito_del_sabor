import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordAudit } from "@/services/audit.service";
import { emailService } from "@/services/email/brevo.service";
/* Password hashes are explicitly stripped before serialization. */
/* eslint-disable @typescript-eslint/no-unused-vars */

const schema = z.object({ email: z.email().transform(value => value.toLowerCase().trim()), firstName: z.string().trim().min(2), lastName: z.string().trim().min(2), roleId: z.string().min(1) });
export async function GET() { try { await requirePermission("users.view"); const [users, roles] = await Promise.all([db.user.findMany({ where: { deletedAt: null }, include: { roles: { include: { role: true } } }, orderBy: { firstName: "asc" } }), db.role.findMany({ orderBy: { name: "asc" } })]); return ok({ users: users.map(({ passwordHash: _passwordHash, ...user }) => user), roles }); } catch (error) { return handleApiError(error); } }
export async function POST(request: Request) { try { const actor = await requirePermission("users.create"); const input = schema.parse(await readJson(request)); const token = randomBytes(32).toString("base64url"); const tokenHash = createHash("sha256").update(token).digest("hex"); const passwordHash = await argon2.hash(randomBytes(48), { type: argon2.argon2id }); const user = await db.$transaction(async tx => { const row = await tx.user.create({ data: { email: input.email, firstName: input.firstName, lastName: input.lastName, passwordHash, roles: { create: { roleId: input.roleId } }, passwordResetTokens: { create: { tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } } } }); await recordAudit(tx, { userId: actor.id, action: "USER_CREATED", module: "users", entity: "User", entityId: row.id, after: { email: row.email, roleId: input.roleId } }); return row; }); void emailService.passwordReset(user.firstName, user.email, token); return ok({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, status: user.status }, { status: 201 }); } catch (error) { return handleApiError(error); } }
