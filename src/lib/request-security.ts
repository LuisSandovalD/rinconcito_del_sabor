import { AuthenticationError, ValidationError } from "./errors";

export function assertSameOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new AuthenticationError("La solicitud no es válida.");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new AuthenticationError("La solicitud no es válida.");
  if (!origin && request.headers.get("x-requested-with") !== "XMLHttpRequest") throw new AuthenticationError("La solicitud no es válida.");
}

export function assertJsonContentType(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ValidationError("El contenido debe enviarse como JSON.");
}
