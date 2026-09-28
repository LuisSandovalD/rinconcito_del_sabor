import type { PrismaClient } from "@/../generated/prisma/client";

type AuditDb = Pick<PrismaClient, "auditLog">;

export type AuditInput = {
  userId?: string;
  action: string;
  module: string;
  entity?: string;
  entityId?: string;
  before?: object;
  after?: object;
  metadata?: object;
  ip?: string;
  userAgent?: string;
};

export function recordAudit(client: AuditDb, input: AuditInput) {
  return client.auditLog.create({ data: input });
}
