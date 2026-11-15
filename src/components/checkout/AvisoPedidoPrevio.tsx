"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Si este dispositivo ya envió un comprobante, ofrece ver su estado en vez de pagar otra vez. */
export function AvisoPedidoPrevio() {
  const [codigo, setCodigo] = useState<string | null>(null);
  useEffect(() => {
    try {
      setCodigo(localStorage.getItem("daxsp-pedido"));
    } catch {}
  }, []);
  if (!codigo) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-marca/40 bg-marca/10 px-4 py-3">
      <p className="text-sm">¿Ya enviaste tu comprobante?</p>
      <Link href={`/estado/${codigo}`} className="text-sm font-semibold text-marca-2 hover:underline">
        Ver el estado de mi pago →
      </Link>
    </div>
  );
}
