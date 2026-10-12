import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/../generated/prisma/client";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/services/audit.service";

const rotateSchema = z.object({ rotate: z.literal(true) });

export async function GET() {
  try {
    await requirePermission("settings.manage");
    const [settings, tables] = await Promise.all([
      db.restaurantSettings.findUnique({
        where: { id: "singleton" },
        select: { tradeName: true, address: true, qrOrderingEnabled: true }
      }),
      db.restaurantTable.findMany({
        where: { active: true },
        orderBy: [{ zone: { sortOrder: "asc" } }, { number: "asc" }],
        select: {
          id: true,
          number: true,
          name: true,
          capacity: true,
          physicalQrOrderingEnabled: true,
          physicalQrRotatedAt: true,
          zone: { select: { name: true } }
        }
      })
    ]);
    if (!settings) throw new ConflictError("Completa primero la configuración general del restaurante.");

    return ok({ settings, tables });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("settings.manage");
    rotateSchema.parse(await readJson(request));
    await rateLimit(`physical-qr-rotate:${user.id}`, 3, 10 * 60_000);

    const result = await db.$transaction(async tx => {
      const settings = await tx.restaurantSettings.findUnique({
        where: { id: "singleton" },
        select: { tradeName: true, address: true, qrOrderingEnabled: true }
      });
      if (!settings) throw new ConflictError("Completa primero la configuración general del restaurante.");
      if (!settings.qrOrderingEnabled) {
        throw new ConflictError("Activa los pedidos desde QR en Configuración antes de generar el PDF.");
      }

      const tables = await tx.restaurantTable.findMany({
        where: { active: true },
        orderBy: [{ zone: { sortOrder: "asc" } }, { number: "asc" }],
        select: { id: true, number: true, name: true, capacity: true, zone: { select: { name: true } } }
      });
      if (!tables.length) throw new ConflictError("No hay mesas activas para generar códigos QR.");

      const rotatedAt = new Date();
      const credentials = tables.map(table => {
        const accessToken = randomBytes(32).toString("base64url");
        return {
          ...table,
          accessToken,
          tokenHash: createHash("sha256").update(accessToken).digest("hex")
        };
      });

      for (const credential of credentials) {
        await tx.restaurantTable.update({
          where: { id: credential.id },
          data: {
            physicalQrTokenHash: credential.tokenHash,
            physicalQrRotatedAt: rotatedAt,
            physicalQrOrderingEnabled: true,
            version: { increment: 1 }
          }
        });
      }

      await recordAudit(tx, {
        userId: user.id,
        action: "PHYSICAL_TABLE_QR_ROTATED",
        module: "security",
        entity: "RestaurantTable",
        metadata: { tableCount: credentials.length, rotatedAt: rotatedAt.toISOString() }
      });

      return {
        settings,
        rotatedAt,
        tables: credentials.map(credential => ({
          id: credential.id,
          number: credential.number,
          name: credential.name,
          capacity: credential.capacity,
          zone: credential.zone,
          accessToken: credential.accessToken
        }))
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requirePermission("settings.manage");
    await readJson(request);
    await rateLimit(`physical-qr-revoke:${user.id}`, 5, 10 * 60_000);

    const disabled = await db.$transaction(async tx => {
      const result = await tx.restaurantTable.updateMany({
        where: { physicalQrOrderingEnabled: true },
        data: {
          physicalQrOrderingEnabled: false,
          physicalQrTokenHash: null,
          physicalQrRotatedAt: null,
          version: { increment: 1 }
        }
      });
      await recordAudit(tx, {
        userId: user.id,
        action: "PHYSICAL_TABLE_QR_REVOKED_ALL",
        module: "security",
        entity: "RestaurantTable",
        metadata: { tableCount: result.count }
      });
      return result.count;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return ok({ success: true, disabled });
  } catch (error) {
    return handleApiError(error);
  }
}
