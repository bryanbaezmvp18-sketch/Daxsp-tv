"use client";

import { useRestante } from "@/components/Cronometro";
import { formatoUSD } from "@/config/curso";
import { descuento, type Precios } from "@/lib/precios-tipos";

const dos = (n: number) => String(n).padStart(2, "0");

function partes(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Caja de un número del contador. `tic` hace un pequeño salto cada vez que cambia. */
function Caja({ valor, etiqueta, tic = false }: { valor: number | null; etiqueta: string; tic?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-linear-to-b from-white/15 to-white/5 shadow-inner ring-1 ring-white/15 sm:h-14 sm:w-14">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-black/30" />
        <span key={tic ? valor ?? "x" : undefined} className={`font-display text-xl font-bold tabular-nums text-white sm:text-2xl ${tic ? "tic-numero" : ""}`}>
          {valor === null ? "--" : dos(valor)}
        </span>
      </div>
      <span className="mt-1 text-[10px] font-semibold tracking-widest text-white/60 uppercase">{etiqueta}</span>
    </div>
  );
}

/** Banner de oferta bajo los botones principales: urgencia + descuento + contador en vivo. */
export function BannerOferta({ p }: { p: Precios }) {
  const { activa, terminaEn, texto } = p.oferta;
  const restante = useRestante(activa ? terminaEn : null);
  if (!activa || !terminaEn || (restante !== null && restante <= 0)) return null;

  const t = restante === null ? null : partes(restante);
  const pct = descuento(p);
  const ultimasHoras = t !== null && t.d === 0 && t.h < 24;

  return (
    <a
      href="#precio"
      aria-label={`${texto}. Ver precio`}
      className="group relative mx-auto mt-6 block max-w-md rounded-2xl p-[1.5px] lg:mx-0"
    >
      {/* Borde degradado animado + resplandor */}
      <span aria-hidden className="borde-oferta absolute inset-0 rounded-2xl bg-[linear-gradient(110deg,#22d3ee,#8b5cf6,#f472b6,#f59e0b,#22d3ee)] bg-[length:250%_100%]" />
      <span aria-hidden className="absolute -inset-2 rounded-3xl bg-acento/25 opacity-60 blur-xl transition group-hover:opacity-90" />

      <span className="relative flex flex-col items-center gap-4 rounded-[15px] bg-[#120b1f]/95 px-4 py-4 sm:flex-row sm:justify-between sm:px-5">
        {/* Texto */}
        <span className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-red-300 uppercase">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            {ultimasHoras ? "Últimas horas" : "Oferta activa"}
          </span>
          <span className="mt-1.5 font-display text-base leading-tight font-bold text-white">
            {pct > 0 ? (
              <>
                <span className="texto-degradado">-{pct}% de descuento</span>
              </>
            ) : (
              texto
            )}
          </span>
          {p.usdAntes && p.usdAntes > p.usd && (
            <span className="mt-0.5 text-sm text-white/70">
              <s className="text-white/45">{formatoUSD(p.usdAntes)}</s> → <b className="text-white">{formatoUSD(p.usd)}</b>
            </span>
          )}
        </span>

        {/* Contador */}
        <span className="flex flex-col items-center">
        <span className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-acento uppercase">⏰ Termina en</span>
        <span className="flex items-start gap-1.5" role="timer" aria-label="Tiempo restante de la oferta">
          {t && t.d > 0 && (
            <>
              <Caja valor={t.d} etiqueta="días" />
              <span className="pt-2.5 font-display text-xl font-bold text-white/40 sm:pt-3">:</span>
            </>
          )}
          <Caja valor={t?.h ?? null} etiqueta="horas" />
          <span className="pt-2.5 font-display text-xl font-bold text-white/40 sm:pt-3">:</span>
          <Caja valor={t?.m ?? null} etiqueta="min" />
          <span className="pt-2.5 font-display text-xl font-bold text-white/40 sm:pt-3">:</span>
          <Caja valor={t?.s ?? null} etiqueta="seg" tic />
        </span>
        </span>
      </span>
    </a>
  );
}
