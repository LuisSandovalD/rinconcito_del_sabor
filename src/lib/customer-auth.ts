import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { AuthenticationError } from "@/lib/errors";

const CUSTOMER_COOKIE = process.env.NODE_ENV === "production" ? "__Host-rinconcito_customer" : "rinconcito_customer";
const SESSION_DAYS = 7;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const headerStore = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.customerSession.create({
    data: {
      customerId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: headerStore.get("user-agent"),
      ip: headerStore.get("x-real-ip")
    }
  });
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt
  });
}

export async function revokeCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (token) await db.customerSession.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  cookieStore.delete(CUSTOMER_COOKIE);
}

export async function getCurrentCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await db.customerSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { customer: true } });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.customer.status !== "ACTIVE" || !session.customer.passwordHash) return null;
  return {
    id: session.customer.id,
    name: session.customer.name,
    firstName: session.customer.name.trim().split(/\s+/)[0] || session.customer.name,
    email: session.customer.email!,
    phone: session.customer.phone!
  };
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) throw new AuthenticationError("Inicia sesión con tu cuenta de cliente para realizar el pedido.");
  return customer;
}
