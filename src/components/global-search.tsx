"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState(""); const router = useRouter();
  const close = () => { setQuery(""); onClose(); };
  if (!open) return null;
  const options = [
    { label: "Salón y mesas", keywords: "mesa salon terraza", href: "/tables" }, { label: "Pedidos activos", keywords: "pedido orden", href: "/orders" },
    { label: "Pantalla de cocina", keywords: "cocina kds comanda", href: "/kitchen" }, { label: "Cobrar cuentas", keywords: "caja pago cobrar", href: "/cash" },
    { label: "Productos y disponibilidad", keywords: "producto plato menu agotado", href: "/products" }, { label: "Inventario", keywords: "stock ingrediente", href: "/inventory" },
    { label: "Reportes de ventas", keywords: "reporte venta estadistica", href: "/reports" }
  ].filter(item => `${item.label} ${item.keywords}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="dialog-backdrop" onMouseDown={close}><div className="command-dialog" onMouseDown={event => event.stopPropagation()}><div className="command-input"><Search size={21}/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="¿A dónde quieres ir?"/><button onClick={close}><X size={19}/></button></div><div className="command-results">{options.map(option => <button key={option.href} onClick={() => { router.push(option.href as never); close(); }}><span>{option.label}</span><small>Abrir</small></button>)}{!options.length && <p>No encontramos resultados.</p>}</div></div></div>;
}
