import "dotenv/config";
import { spawnSync } from "node:child_process";
import { resolveMigrationUrl } from "./lib/migration-url.mjs";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function runMigrationWithRetry(command, args) {
  const delays = [5_000, 10_000, 15_000, 20_000, 30_000];
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32", env: process.env });
    if (result.status === 0) return;
    if (attempt === delays.length) process.exit(result.status ?? 1);
    const wait = delays[attempt];
    console.warn(`[vercel-build] Prisma Migrate no obtuvo el bloqueo. Reintento ${attempt + 2}/${delays.length + 1} en ${wait / 1000}s...`);
    sleep(wait);
  }
}

const npmExec = process.platform === "win32" ? "npx.cmd" : "npx";
const npmRun = process.platform === "win32" ? "npm.cmd" : "npm";

run(npmExec, ["prisma", "generate", "--config=prisma.config.ts"]);

const shouldMigrate =
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL_RUN_MIGRATIONS === "1";

if (shouldMigrate) {
  const migrationConnection = resolveMigrationUrl();
  process.env.DIRECT_URL = migrationConnection.url;
  if (migrationConnection.derivedDirectUrl) {
    console.log("[vercel-build] La URL configurada usa el pooler de Neon; Prisma Migrate usará el endpoint directo equivalente.");
  }
  console.log("[vercel-build] Aplicando migraciones de producción...");
  runMigrationWithRetry(npmExec, ["prisma", "migrate", "deploy", "--config=prisma.config.ts"]);
} else {
  console.log("[vercel-build] Preview/development: migraciones omitidas. Define VERCEL_RUN_MIGRATIONS=1 para habilitarlas.");
}

run(npmRun, ["run", "build:next"]);
