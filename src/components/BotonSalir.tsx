"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cerrarSesion } from "@/lib/auth-cliente";

export function BotonSalir({ className = "text-sm text-suave transition hover:text-texto disabled:opacity-60" }: { className?: string }) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);
  return (
    <button
      onClick={async () => {
        setSaliendo(true);
        await cerrarSesion();
        router.replace("/admin/login");
        router.refresh();
      }}
      disabled={saliendo}
      className={className}
    >
      <span aria-hidden>⏻</span>
      {saliendo ? (
        "Saliendo…"
      ) : (
        <>
          <span className="sm:hidden">Salir</span>
          <span className="hidden sm:inline">Cerrar sesión</span>
        </>
      )}
    </button>
  );
}
