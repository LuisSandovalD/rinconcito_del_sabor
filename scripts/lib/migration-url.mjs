export function resolveMigrationUrl(environment = process.env) {
  const configured = environment.DIRECT_URL || environment.DATABASE_URL;
  if (!configured) throw new Error("DIRECT_URL o DATABASE_URL es obligatoria para ejecutar migraciones.");

  const url = new URL(configured);
  const isNeonPooler = url.hostname.endsWith(".neon.tech") && url.hostname.includes("-pooler.");
  if (isNeonPooler) {
    url.hostname = url.hostname.replace("-pooler.", ".");
    return { url: url.toString(), derivedDirectUrl: true };
  }

  return { url: configured, derivedDirectUrl: false };
}
