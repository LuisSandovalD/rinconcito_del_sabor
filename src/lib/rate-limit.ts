import { createHash } from "node:crypto";
import { Prisma } from "@/../generated/prisma/client";
import { db } from "@/lib/db";
import { RateLimitError } from "@/lib/errors";

export async function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const keyHash = createHash("sha256").update(key).digest("hex");
  const now = new Date();
  try {
    await db.$transaction(async tx => {
      const current = await tx.rateLimitBucket.findUnique({ where: { keyHash } });
      if (!current || current.resetAt <= now) {
        await tx.rateLimitBucket.upsert({
          where: { keyHash },
          update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
          create: { keyHash, count: 1, resetAt: new Date(now.getTime() + windowMs) }
        });
        return;
      }
      if (current.count >= limit) throw new RateLimitError("Demasiados intentos. Espera un momento antes de volver a intentar.");
      await tx.rateLimitBucket.update({ where: { keyHash }, data: { count: { increment: 1 } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new RateLimitError("Demasiados intentos. Espera un momento antes de volver a intentar.");
    throw error;
  }
}
