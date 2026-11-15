"use client";

import { formatoUSD } from "@/config/curso";
import { Cronometro, useRestante } from "@/components/Cronometro";
import type { Precios } from "@/lib/precios-tipos";

/** Barra superior con la oferta y su cuenta regresiva (se controla en Panel → Precios). */
export function BarraOferta({ p }: { p: Precios }) {
  const { activa, texto, terminaEn } = p.oferta;
  const restante = useRestante(activa ? terminaEn : null);
  if (!activa || !terminaEn || (restante !== null && restante <= 0)) return null;

  return (
    <div className="bg-linear-to-r from-marca/90 via-acento/80 to-marca/90 text-white">
      <a
        href="#precio"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs sm:text-sm"
      >
        <span className="font-semibold">🔥 {texto}</span>
        {p.usdAntes && (
          <span>
            <s className="opacity-70">{formatoUSD(p.usdAntes)}</s> → <b>{formatoUSD(p.usd)}</b>
          </span>
        )}
        <span className="rounded-full bg-black/25 px-2.5 py-0.5">
          Termina en <Cronometro fin={terminaEn} variante="linea" />
        </span>
      </a>
    </div>
  );
}
