type ApiEnvelope<T> = { data?: T; error?: string; code?: string; requestId?: string };

export class ClientApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string, public readonly requestId?: string) {
    super(message);
    this.name = "ClientApiError";
  }
}

const statusMessage = (status: number) => {
  if (status === 401) return "Tu sesión venció. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 408 || status === 504) return "La operación tardó demasiado. Comprueba el estado antes de volver a intentarlo.";
  if (status === 502 || status === 503) return "El servicio no está disponible temporalmente. Inténtalo en unos segundos.";
  return `La operación no pudo completarse (HTTP ${status}).`;
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "same-origin",
      headers: { "content-type": "application/json", "x-requested-with": "XMLHttpRequest", ...init?.headers }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ClientApiError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.", 0, "NETWORK_ERROR");
  }

  const rawBody = await response.text();
  let body: ApiEnvelope<T> = {};
  if (rawBody) {
    try {
      body = JSON.parse(rawBody) as ApiEnvelope<T>;
    } catch {
      // Proxies may return HTML for timeouts or outages. The HTTP status still
      // lets us show a useful message instead of hiding the actual category.
    }
  }
  if (!response.ok) throw new ClientApiError(body.error ?? statusMessage(response.status), response.status, body.code, body.requestId ?? response.headers.get("x-request-id") ?? undefined);
  return body.data as T;
}

export const money = (value: number | string) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value));
export const shortTime = (value: string | Date) => new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
export const elapsed = (value: string | Date) => Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
