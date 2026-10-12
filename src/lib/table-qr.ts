export function validateTableQrValue(rawValue: string, origin: string) {
  const url = new URL(rawValue, origin);
  if (url.origin !== origin) throw new Error("El QR no pertenece a este restaurante.");
  if (!/^\/menu\/mesa\/\d+$/.test(url.pathname)) throw new Error("Este no es un QR válido de mesa.");
  const token = new URLSearchParams(url.hash.slice(1)).get("access") ?? "";
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) throw new Error("El QR de la mesa está incompleto o fue alterado.");
  return url.href;
}
