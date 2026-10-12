import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { getServerEnv } from "@/lib/env";
import { hardenPostgresSslUrl } from "@/lib/postgres-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const { DATABASE_URL } = getServerEnv();
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: hardenPostgresSslUrl(DATABASE_URL) }) });
}

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
