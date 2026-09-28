import { Pool, type Notification, type PoolClient } from "pg";
import { getServerEnv } from "@/lib/env";

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
    globalForRealtime.realtimePool = new Pool({ connectionString: getServerEnv().DATABASE_URL, max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 });
  }
  return globalForRealtime.realtimePool;
}

export async function publishRealtimeEvent(event: Omit<RealtimeEvent, "at">) {
  const payload = JSON.stringify({ ...event, at: new Date().toISOString() } satisfies RealtimeEvent);
  await getPool().query("SELECT pg_notify($1, $2)", [CHANNEL, payload]);
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
