import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { AuthenticationError, AuthorizationError } from "@/lib/errors";
import type { PermissionCode } from "@/lib/permissions";

export const SESSION_COOKIE = "rinconcito_session";
const SESSION_DAYS = 14;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const headerStore = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: headerStore.get("user-agent"),
      ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
    }
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await db.session.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") return null;
  const roles = session.user.roles.map(item => item.role.name);
  const permissions = [...new Set(session.user.roles.flatMap(item => item.role.permissions.map(link => link.permission.code)))] as PermissionCode[];
  return {
    id: session.user.id,
    email: session.user.email,
    name: `${session.user.firstName} ${session.user.lastName}`,
    firstName: session.user.firstName,
    roles,
    permissions
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError("Tu sesión venció. Inicia sesión nuevamente.");
  return user;
}

export async function requirePermission(permission: PermissionCode) {
  const user = await requireUser();
  if (!user.permissions.includes(permission)) throw new AuthorizationError("No tienes permiso para realizar esta acción.");
  return user;
}
