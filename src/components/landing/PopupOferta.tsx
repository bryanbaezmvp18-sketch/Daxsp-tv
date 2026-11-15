"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatoDOP, formatoUSD, marca, precio } from "@/config/curso";
import { descuento, ofertaVigente, type Precios } from "@/lib/precios-tipos";
import { Cronometro } from "@/components/Cronometro";
import { BotonComprar } from "./BotonComprar";
import { EVENTO_INTRO_FIN, introTerminada } from "./VideoIntro";

/** Solo una vez por carga de la página (si vuelve a la portada sin recargar, no se repite). */
let yaMostrado = false;

/**
 * Ventana con la oferta que aparece al entrar al menú principal (después del video).
 * Se cierra con la ✕, con «Seguir viendo la página», tocando fuera o con Esc.
 */
export function PopupOferta({ p }: { p: Precios }) {
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (yaMostrado || !ofertaVigente(p.oferta)) return;
    let t: ReturnType<typeof setTimeout>;
    const mostrar = () => {
      if (yaMostrado) return;
      yaMostrado = true;
      t = setTimeout(() => setAbierto(true), 600); // un respiro para ver la portada
    };
    if (introTerminada()) mostrar();
    window.addEventListener(EVENTO_INTRO_FIN, mostrar);
    return () => {
      window.removeEventListener(EVENTO_INTRO_FIN, mostrar);
      clearTimeout(t);
    };
  }, [p.oferta]);

  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.documentElement.style.overflow = "";
    };
  }, [abierto]);

  function cerrar() {
    setSaliendo(true);
    setTimeout(() => {
      setAbierto(false);
      setSaliendo(false);
    }, 250);
  }

  if (!abierto) return null;

  const pct = descuento(p);
  const ahorro = p.usdAntes && p.usdAntes > p.usd ? p.usdAntes - p.usd : 0;
  const fin = p.oferta.terminaEn ? new Date(p.oferta.terminaEn) : null;
  const finTexto = fin
    ? fin.toLocaleString("es-DO", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Santo_Domingo" })
    : "";

  return createPortal(
    <div
      className={`fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        saliendo ? "opacity-0" : "popup-entrada-fondo"
      }`}
      onClick={cerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-oferta-titulo"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md ${saliendo ? "scale-95 opacity-0 transition duration-200" : "popup-entrada"}`}
      >
        {/* Borde degradado animado + resplandor (mismo estilo que el banner de oferta) */}
        <span aria-hidden className="absolute -inset-3 rounded-[2rem] bg-marca/30 blur-2xl" />
        <span aria-hidden className="borde-oferta absolute inset-0 rounded-3xl bg-[linear-gradient(110deg,#22d3ee,#8b5cf6,#f472b6,#f59e0b,#22d3ee)] bg-[length:250%_100%]" />

        <div className="relative m-[2px] overflow-hidden rounded-[22px] bg-[#120b1f] px-5 pt-8 pb-6 text-center sm:px-8">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-marca/30 blur-3xl" />

          <button
            ref={cerrarRef}
            type="button"
            onClick={cerrar}
            aria-label="Cerrar oferta"
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-lg text-suave transition hover:bg-white/15 hover:text-texto"
          >
            ✕
          </button>

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-extrabold tracking-wider text-red-300 uppercase ring-1 ring-red-400/30">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              {pct > 0 ? `Descuento activo · -${pct}%` : "Oferta activa"}
            </span>

            <h2 id="popup-oferta-titulo" className="mt-4 font-display text-2xl leading-tight font-bold text-balance sm:text-3xl">
              Estás recibiendo un descuento en <span className="texto-degradado">{marca.nombre}</span>
            </h2>
            {p.oferta.texto && <p className="mt-2 text-sm text-suave">{p.oferta.texto}</p>}

            {/* Precio */}
            <div className="mt-5 flex items-end justify-center gap-3">
              {p.usdAntes && pct > 0 && (
                <s className="pb-1.5 font-display text-2xl font-bold text-suave decoration-red-400 decoration-2">{formatoUSD(p.usdAntes)}</s>
              )}
              <span className="font-display text-5xl font-extrabold text-yellow-400 sm:text-6xl">{formatoUSD(p.usd)}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-emerald-300">
              {ahorro > 0 && `Ahorras ${formatoUSD(ahorro)}`}
              {ahorro > 0 && precio.pagoUnico && " · "}
              {precio.pagoUnico && "pago único"}
            </p>
            <p className="mt-0.5 text-xs text-suave">o {formatoDOP(p.dop)} por transferencia</p>

            {/* Cronómetro */}
            <div className="mt-5">
              <Cronometro fin={p.oferta.terminaEn} />
            </div>
            {finTexto && <p className="mt-3 text-xs text-suave">La oferta termina el {finTexto} (hora de RD).</p>}

            <BotonComprar p={p} texto="Quiero mi descuento" reloj={false} tachado={false} className="mt-6 w-full py-4! text-lg!" />

            <button type="button" onClick={cerrar} className="mt-4 text-sm text-suave underline-offset-4 hover:text-texto hover:underline">
              Seguir viendo la página
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
