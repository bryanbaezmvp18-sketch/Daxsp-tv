"use client";

import { useState } from "react";
import { salirCliente } from "@/lib/google-cliente";

export function BotonSalirCliente() {
  const [saliendo, setSaliendo] = useState(false);
  return (
    <button
      onClick={async () => {
        setSaliendo(true);
        await salirCliente();
        window.location.href = "/";
      }}
      disabled={saliendo}
      className="text-sm text-suave transition hover:text-texto disabled:opacity-60"
    >
      {saliendo ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
