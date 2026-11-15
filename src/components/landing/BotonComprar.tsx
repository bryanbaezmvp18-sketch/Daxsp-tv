"use client";

import { formatoUSD } from "@/config/curso";
import { descuento, type Precios } from "@/lib/precios-tipos";
import { useRestante } from "@/components/Cronometro";

const dos = (n: number) => String(n).padStart(2, "0");

function textoRestante(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d > 0 ? `${d}d ` : ""}${dos(h)}:${dos(m)}:${dos(s % 60)}`;
}

/**
 * Botón amarillo de compra con:
 * - etiqueta roja «-X% OFF» en la esquina (si hay precio anterior),
 * - precio anterior tachado + precio actual,
 * - cronómetro de la oferta en vivo debajo (solo mientras la oferta esté vigente).
 * Todo sale de los precios del panel de administrador.
 */
export function BotonComprar({
  p,
  texto = "Comprar ahora",
  href = "/checkout",
  compacto = false,
  icono = !compacto,
  tachado = true,
  reloj = true,
  className = "",
  onClick,
}: {
  /** false = sin la pastilla del cronómetro (p. ej. si ya hay un cronómetro grande al lado) */
  reloj?: boolean;
  p: Precios;
  texto?: string;
  href?: string;
  compacto?: boolean;
  icono?: boolean;
  tachado?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const pct = descuento(p);
  const fin = reloj && p.oferta.activa ? p.oferta.terminaEn : null;
  const restante = useRestante(fin);
  const conReloj = restante !== null && restante > 0;

  return (
    <a
      href={href}
      onClick={onClick}
      className={`btn-comprar relative whitespace-nowrap ${compacto ? "gap-1.5 px-4! py-2! text-sm" : "text-base"} ${fin && !compacto ? "mb-2.5" : ""} ${className}`}
    >
      {pct > 0 && (
        <span
          className={`absolute -top-2.5 -right-1.5 rotate-6 rounded-full bg-red-600 font-extrabold text-white shadow-md shadow-black/40 ring-2 ring-fondo ${compacto ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-xs"}`}
        >
          -{pct}% OFERTA
        </span>
      )}

      {icono && (
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
      )}
      {texto}
      {tachado && p.usdAntes && pct > 0 && (
        <s className={`font-semibold text-black/55 ${compacto ? "text-xs" : "text-sm"}`}>{formatoUSD(p.usdAntes)}</s>
      )}
      <span className={`rounded-full bg-black font-bold text-yellow-400 ${compacto ? "px-1.5 py-px text-xs" : "px-2 py-0.5 text-sm"}`}>
        {formatoUSD(p.usd)}
      </span>

      {conReloj && (
        <span
          role="timer"
          aria-label="Tiempo restante de la oferta"
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black px-2 py-px font-mono text-[10px] font-bold tabular-nums text-yellow-400 shadow-md shadow-black/40 ring-2 ring-fondo"
        >
          ⏰ {textoRestante(restante)}
        </span>
      )}
    </a>
  );
}
