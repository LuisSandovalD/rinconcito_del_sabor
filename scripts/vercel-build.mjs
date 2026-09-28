import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const npmExec = process.platform === "win32" ? "npx.cmd" : "npx";
const npmRun = process.platform === "win32" ? "npm.cmd" : "npm";

run(npmExec, ["prisma", "generate", "--config=prisma.config.ts"]);

const shouldMigrate =
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL_RUN_MIGRATIONS === "1";

if (shouldMigrate) {
  console.log("[vercel-build] Aplicando migraciones de producción...");
  run(npmExec, ["prisma", "migrate", "deploy", "--config=prisma.config.ts"]);
} else {
  console.log("[vercel-build] Preview/development: migraciones omitidas. Define VERCEL_RUN_MIGRATIONS=1 para habilitarlas.");
}

run(npmRun, ["run", "build:next"]);
