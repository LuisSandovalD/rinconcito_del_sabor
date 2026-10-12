import { Pool, type Notification, type PoolClient } from "pg";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { hardenPostgresSslUrl } from "@/lib/postgres-url";

const CHANNEL = "rinconcito_updates";
const globalForRealtime = globalThis as unknown as { realtimePool?: Pool };

export type RealtimeEvent = {
  resource: string;
  action: "created" | "updated" | "deleted" | "status_changed";
  id?: string;
  at: string;
};

function getPool() {
  if (!globalForRealtime.realtimePool) {
    globalForRealtime.realtimePool = new Pool({
      connectionString: hardenPostgresSslUrl(getServerEnv().DATABASE_URL),
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 2_000,
      query_timeout: 2_000
    });
  }
  return globalForRealtime.realtimePool;
}

export async function publishRealtimeEvent(event: Omit<RealtimeEvent, "at">) {
  const payload = JSON.stringify({ ...event, at: new Date().toISOString() } satisfies RealtimeEvent);
  try {
    await getPool().query("SELECT pg_notify($1, $2)", [CHANNEL, payload]);
  } catch (error) {
    // The database transaction has already completed at every call site. A
    // notification failure must not make a confirmed order look unsuccessful.
    logger.warn("Realtime notification could not be published", {
      resource: event.resource,
      action: event.action,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof error === "object" && error && "code" in error ? String(error.code) : undefined
    });
  }
}

export async function subscribeRealtime(onEvent: (event: RealtimeEvent) => void) {
  const client: PoolClient = await getPool().connect();

  const handleNotification = (message: Notification) => {
    if (message.channel !== CHANNEL || !message.payload) return;
    try {
      onEvent(JSON.parse(message.payload) as RealtimeEvent);
    } catch {
      // Ignore malformed notifications so one bad payload does not break the stream.
    }
  };

  client.on("notification", handleNotification);
  await client.query(`LISTEN "${CHANNEL}"`);

  return async () => {
    client.removeListener("notification", handleNotification);
    try {
      await client.query(`UNLISTEN "${CHANNEL}"`);
    } finally {
      client.release();
    }
  };
}
