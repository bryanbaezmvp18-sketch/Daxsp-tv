"use client";

import { useEffect, useState } from "react";
import { reanudarSesion } from "@/lib/google-cliente";

/**
 * Si este navegador ya inició sesión con Google antes (aunque haya cerrado
 * la pestaña), renueva la sesión y lo lleva a su sitio sin pedirle nada.
 */
export function Reanudar({ next, children }: { next?: string; children: React.ReactNode }) {
  const [comprobando, setComprobando] = useState(true);
  useEffect(() => {
    reanudarSesion()
      .then((destino) => {
        if (destino) window.location.href = next && destino !== "/checkout" ? next : destino;
        else setComprobando(false);
      })
      .catch(() => setComprobando(false));
  }, [next]);

  if (comprobando) return <p className="py-6 text-center text-sm text-suave">Comprobando tu sesión…</p>;
  return <>{children}</>;
}
