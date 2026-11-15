"use client";

import { useState } from "react";

export function BotonCopiar({ valor, etiqueta = "Copiar" }: { valor: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor);
        } catch {
          // Navegadores antiguos
          const t = document.createElement("textarea");
          t.value = valor;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          t.remove();
        }
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1600);
      }}
      className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
        copiado ? "border-marca-2/50 bg-marca-2/15 text-marca-2" : "border-borde bg-white/5 text-suave hover:text-texto"
      }`}
      aria-label={`${etiqueta}: ${valor}`}
    >
      {copiado ? "✓ Copiado" : etiqueta}
    </button>
  );
}
