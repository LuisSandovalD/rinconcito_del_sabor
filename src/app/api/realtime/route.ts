import { subscribeRealtime, type RealtimeEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => Promise<void>) | undefined;

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    if (unsubscribe) await unsubscribe();
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: RealtimeEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: update\ndata: ${JSON.stringify(event)}\n\n`));
      };

      try {
        unsubscribe = await subscribeRealtime(send);
        controller.enqueue(encoder.encode(": connected\n\n"));
        heartbeat = setInterval(() => {
          if (!closed) controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }, 25000);
      } catch (error) {
        closed = true;
        controller.error(error);
        return;
      }

      request.signal.addEventListener("abort", () => {
        void cleanup();
      }, { once: true });
    },
    cancel() {
      return cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
