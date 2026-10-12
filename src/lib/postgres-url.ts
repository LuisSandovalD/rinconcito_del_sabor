const LEGACY_STRICT_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export function hardenPostgresSslUrl(connectionString: string) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";

  if (!isLocal && sslMode && LEGACY_STRICT_SSL_MODES.has(sslMode)) {
    // pg v8 currently treats these modes as verify-full, but pg v9 will adopt
    // weaker libpq semantics. Keep hostname and certificate verification explicit.
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
