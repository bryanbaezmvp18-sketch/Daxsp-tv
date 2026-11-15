"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cerrarSesion } from "@/lib/auth-cliente";

export function BotonSalir() {
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
      className="text-sm text-suave transition hover:text-texto disabled:opacity-60"
    >
      {saliendo ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
