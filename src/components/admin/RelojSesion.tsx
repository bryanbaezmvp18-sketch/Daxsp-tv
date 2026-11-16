"use client";

import { useEffect, useState } from "react";

/**
 * Muestra hasta qué hora dura la sesión del panel y, al caducar,
 * recarga la página para que el servidor pida iniciar sesión de nuevo.
 */
export function RelojSesion({ expira }: { expira: number }) {
  const [hora, setHora] = useState("");
  const [pocoTiempo, setPocoTiempo] = useState(false);

  useEffect(() => {
    setHora(new Date(expira).toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" }));
    const revisar = () => {
      const falta = expira - Date.now();
      setPocoTiempo(falta < 15 * 60 * 1000);
      if (falta <= 0) window.location.reload();
    };
    revisar();
    const id = setInterval(revisar, 30_000);
    // Recarga justo al caducar (si la pestaña sigue abierta)
    const fin = setTimeout(() => window.location.reload(), Math.max(0, expira - Date.now()) + 1000);
    return () => {
      clearInterval(id);
      clearTimeout(fin);
    };
  }, [expira]);

  if (!hora) return null;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${pocoTiempo ? "border border-red-400/50 bg-red-400/15 text-red-200" : "border border-amber-400/40 bg-amber-400/10 text-amber-200"}`}
      title="Por seguridad, la sesión del panel se cierra sola 5 horas después de entrar"
    >
      🔒 <span className="hidden sm:inline">Sesión hasta </span>{hora}
    </span>
  );
}
