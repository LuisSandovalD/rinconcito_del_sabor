import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Revisa los datos ingresados.", code: "VALIDATION_ERROR", details: error.flatten() }, { status: 400 });
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: error.status });
  }
  logger.error("Unhandled API error", { error: error instanceof Error ? error.message : String(error) });
  return NextResponse.json({ error: "No pudimos completar la operación. Inténtalo nuevamente.", code: "INTERNAL_ERROR" }, { status: 500 });
}

export function assertSameOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return;
  if (new URL(origin).host !== host) throw new AuthenticationError("La solicitud no es válida.");
}

export async function readJson<T>(request: Request): Promise<T> {
  assertSameOrigin(request);
  return request.json() as Promise<T>;
}
