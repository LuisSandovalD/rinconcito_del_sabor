export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const body = await response.json() as { data?: T; error?: string };
  if (!response.ok) throw new Error(body.error ?? "No pudimos completar la operación.");
  return body.data as T;
}

export const money = (value: number | string) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value));
export const shortTime = (value: string | Date) => new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
export const elapsed = (value: string | Date) => Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
