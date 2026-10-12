import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { assertJsonContentType, assertSameOrigin } from "@/lib/request-security";

export { assertSameOrigin } from "@/lib/request-security";

export function ok<T>(data: T, init?: ResponseInit) {
  const response = NextResponse.json({ data }, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

type DatabaseErrorResponse = {
  message: string;
  code: string;
  status: number;
  retryAfter?: string;
};

const databaseErrors: Record<string, DatabaseErrorResponse> = {
  P2002: { message: "Ya existe un registro con esos datos. Actualiza la pantalla e inténtalo otra vez.", code: "DUPLICATE_RECORD", status: 409 },
  P2003: { message: "La operación depende de información que cambió o ya no existe. Actualiza la pantalla.", code: "RELATED_RECORD_CONFLICT", status: 409 },
  P2025: { message: "El registro solicitado ya no existe. Actualiza la pantalla.", code: "NOT_FOUND", status: 404 },
  P2034: { message: "Otra operación modificó estos datos al mismo tiempo. Inténtalo nuevamente.", code: "CONCURRENT_UPDATE", status: 409, retryAfter: "1" },
  P2028: { message: "La transacción tardó demasiado y no pudo completarse. Inténtalo nuevamente.", code: "TRANSACTION_TIMEOUT", status: 503, retryAfter: "2" },
  P1000: { message: "El servicio no está disponible por una configuración interna. Contacta al administrador.", code: "DATABASE_AUTH_ERROR", status: 503 },
  P1001: { message: "La base de datos no está disponible en este momento. Inténtalo en unos segundos.", code: "DATABASE_UNAVAILABLE", status: 503, retryAfter: "3" },
  P1002: { message: "La base de datos tardó demasiado en responder. Inténtalo en unos segundos.", code: "DATABASE_TIMEOUT", status: 503, retryAfter: "3" },
  P1008: { message: "La base de datos tardó demasiado en completar la operación. Inténtalo nuevamente.", code: "DATABASE_TIMEOUT", status: 503, retryAfter: "3" },
  P1017: { message: "Se perdió temporalmente la conexión con la base de datos. Inténtalo nuevamente.", code: "DATABASE_CONNECTION_CLOSED", status: 503, retryAfter: "3" },
  P2021: { message: "El servicio necesita una actualización interna. Contacta al administrador.", code: "DATABASE_SCHEMA_OUTDATED", status: 503 },
  P2022: { message: "El servicio necesita una actualización interna. Contacta al administrador.", code: "DATABASE_SCHEMA_OUTDATED", status: 503 },
  "23505": { message: "Ya existe un registro con esos datos. Actualiza la pantalla e inténtalo otra vez.", code: "DUPLICATE_RECORD", status: 409 },
  "23503": { message: "La operación depende de información que cambió o ya no existe. Actualiza la pantalla.", code: "RELATED_RECORD_CONFLICT", status: 409 },
  "40001": { message: "Otra operación modificó estos datos al mismo tiempo. Inténtalo nuevamente.", code: "CONCURRENT_UPDATE", status: 409, retryAfter: "1" },
  "40P01": { message: "Otra operación estaba usando estos datos. Inténtalo nuevamente.", code: "CONCURRENT_UPDATE", status: 409, retryAfter: "1" },
  "53300": { message: "La base de datos está atendiendo demasiadas conexiones. Inténtalo en unos segundos.", code: "DATABASE_BUSY", status: 503, retryAfter: "3" },
  "57P01": { message: "La base de datos se está reiniciando. Inténtalo en unos segundos.", code: "DATABASE_UNAVAILABLE", status: 503, retryAfter: "3" }
};

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const candidate = "code" in error ? error.code : "errorCode" in error ? error.errorCode : undefined;
  return typeof candidate === "string" ? candidate : undefined;
}

function errorResponse(message: string, code: string, status: number, requestId: string, details?: unknown, retryAfter?: string) {
  const response = NextResponse.json({ error: message, code, requestId, ...(details === undefined ? {} : { details }) }, { status });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Request-Id", requestId);
  if (retryAfter) response.headers.set("Retry-After", retryAfter);
  return response;
}

export function handleApiError(error: unknown) {
  const requestId = randomUUID();
  if (error instanceof ZodError) {
    return errorResponse("Revisa los datos ingresados.", "VALIDATION_ERROR", 400, requestId, error.flatten());
  }
  if (error instanceof AppError) {
    return errorResponse(error.message, error.code, error.status, requestId, error.details);
  }

  const code = getErrorCode(error);
  const databaseError = code ? databaseErrors[code] : undefined;
  if (databaseError) {
    logger.error("Database API error", {
      requestId,
      errorCode: code,
      errorName: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : undefined
    });
    return errorResponse(databaseError.message, databaseError.code, databaseError.status, requestId, undefined, databaseError.retryAfter);
  }

  logger.error("Unhandled API error", {
    requestId,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  return errorResponse(`Ocurrió un error inesperado. Código de soporte: ${requestId.slice(0, 8)}.`, "INTERNAL_ERROR", 500, requestId);
}

export async function readJson<T>(request: Request): Promise<T> {
  assertSameOrigin(request);
  assertJsonContentType(request);
  try {
    return await request.json() as T;
  } catch (error) {
    if (error instanceof SyntaxError) throw new ValidationError("El cuerpo de la solicitud no contiene JSON válido.");
    throw error;
  }
}
