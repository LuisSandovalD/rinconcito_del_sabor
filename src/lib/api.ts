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
