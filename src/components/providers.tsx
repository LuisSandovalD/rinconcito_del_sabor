"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";

type ConnectionState = "connected" | "reconnecting" | "offline";
const ConnectionContext = createContext<ConnectionState>("connected");
export const useConnection = () => useContext(ConnectionContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always"
    }
  }
});

function RealtimeBridge({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const [connection, setConnection] = useState<ConnectionState>("reconnecting");

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (!navigator.onLine) { setConnection("offline"); return; }
      setConnection("reconnecting");
      source?.close();
      source = new EventSource("/api/realtime");
      source.onopen = () => {
        setConnection("connected");
        if (reconnectTimer) clearTimeout(reconnectTimer);
      };
      source.onerror = () => {
        source?.close();
        setConnection(navigator.onLine ? "reconnecting" : "offline");
        if (navigator.onLine) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 2_000);
        }
      };
      source.addEventListener("update", event => {
        const payload = JSON.parse((event as MessageEvent).data) as { resource: string; action: string };
        const keys: Record<string, string[]> = {
          orders: ["orders", "external-orders", "tables", "dashboard"], tables: ["tables", "dashboard"], products: ["products"], reservations: ["reservations", "tables"],
          payments: ["orders", "tables", "cash", "dashboard", "reports"], inventory: ["inventory", "dashboard"],
          cash: ["cash", "dashboard"], notifications: ["notifications"]
        };
        for (const key of keys[payload.resource] ?? [payload.resource]) void client.invalidateQueries({ queryKey: [key] });
        if (payload.resource === "notifications" && payload.action === "created") toast.success("Hay un pedido listo para entregar.");
      });
    };
    const online = () => connect();
    const offline = () => setConnection("offline");
    window.addEventListener("online", online); window.addEventListener("offline", offline);
    connect();
    return () => { source?.close(); if (reconnectTimer) clearTimeout(reconnectTimer); window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, [client]);

  return <ConnectionContext.Provider value={connection}>{children}</ConnectionContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => { if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") void navigator.serviceWorker.register("/sw.js"); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeBridge>{children}</RealtimeBridge>
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
