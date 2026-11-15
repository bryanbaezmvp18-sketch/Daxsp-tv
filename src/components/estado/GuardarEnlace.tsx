"use client";

import { useEffect, useState } from "react";
import { BotonCopiar } from "@/components/checkout/BotonCopiar";

/** Recuerda este pedido en el dispositivo y permite copiar el enlace para volver luego. */
export function GuardarEnlace() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(location.href);
    try {
      localStorage.setItem("daxsp-pedido", location.pathname.split("/").pop() ?? "");
    } catch {}
  }, []);
  if (!url) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-borde px-4 py-3">
      <p className="text-xs text-suave">Guarda este enlace para consultar tu pago cuando quieras.</p>
      <BotonCopiar valor={url} etiqueta="Copiar enlace" />
    </div>
  );
}
