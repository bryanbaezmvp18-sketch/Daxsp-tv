"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Seccion = "pedidos" | "curso" | "precios" | "cuentas" | "administradores";

/** Cada sección con su color: chip del ícono, texto y relleno cuando está activa. */
const SECCIONES: {
  href: string;
  texto: string;
  clave: Seccion;
  icono: string;
  chip: string;
  texto_: string;
  activo: string;
}[] = [
  {
    href: "/admin", texto: "Pedidos", clave: "pedidos", icono: "🧾",
    chip: "bg-amber-400/20 ring-amber-400/50", texto_: "text-amber-200",
    activo: "border-amber-400 bg-amber-400/20 text-white shadow-[0_0_18px_-2px_rgba(251,191,36,.8)]",
  },
  {
    href: "/admin/curso", texto: "Curso", clave: "curso", icono: "🎓",
    chip: "bg-cyan-400/20 ring-cyan-400/50", texto_: "text-cyan-200",
    activo: "border-cyan-400 bg-cyan-400/20 text-white shadow-[0_0_18px_-2px_rgba(34,211,238,.8)]",
  },
  {
    href: "/admin/precios", texto: "Precios", clave: "precios", icono: "💲",
    chip: "bg-emerald-400/20 ring-emerald-400/50", texto_: "text-emerald-200",
    activo: "border-emerald-400 bg-emerald-400/20 text-white shadow-[0_0_18px_-2px_rgba(52,211,153,.8)]",
  },
  {
    href: "/admin/cuentas", texto: "Cuentas", clave: "cuentas", icono: "🏦",
    chip: "bg-pink-400/20 ring-pink-400/50", texto_: "text-pink-200",
    activo: "border-pink-400 bg-pink-400/20 text-white shadow-[0_0_18px_-2px_rgba(244,114,182,.8)]",
  },
  {
    href: "/admin/administradores", texto: "Admins", clave: "administradores", icono: "👥",
    chip: "bg-violet-400/20 ring-violet-400/50", texto_: "text-violet-200",
    activo: "border-violet-400 bg-violet-400/20 text-white shadow-[0_0_18px_-2px_rgba(167,139,250,.8)]",
  },
];

/** true mientras se desliza hacia abajo; false al subir o arriba del todo. */
function useMinimizado() {
  const [minimizado, setMinimizado] = useState(false);
  const ultimaY = useRef(0);
  useEffect(() => {
    ultimaY.current = window.scrollY;
    let pendiente = false;
    const revisar = () => {
      pendiente = false;
      const y = window.scrollY;
      const delta = y - ultimaY.current;
      if (y < 120) setMinimizado(false); // cerca de arriba: tamaño normal
      else if (delta > 6) setMinimizado(true); // bajando
      else if (delta < -6) setMinimizado(false); // subiendo
      if (Math.abs(delta) > 6 || y < 120) ultimaY.current = y;
    };
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(revisar);
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);
  return minimizado;
}

/**
 * Menú del panel en cápsula luminosa, fijo arriba. Cada sección tiene su color.
 * Al deslizar hacia abajo se minimiza (en el celular, solo íconos); al subir vuelve.
 */
export function MenuAdmin({ activa }: { activa: Seccion }) {
  const mini = useMinimizado();

  return (
    <nav
      aria-label="Secciones del panel"
      className={`sticky top-0 z-40 border-b border-marca/30 bg-[#0b0816]/90 backdrop-blur-xl transition-[padding] duration-300 ${mini ? "py-1.5" : "py-3"}`}
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Borde de la cápsula con los colores de la marca */}
        <div
          className={`bg-[linear-gradient(110deg,#22d3ee,#8b5cf6,#f472b6,#f59e0b,#22d3ee)] p-[2px] shadow-[0_0_28px_-6px_var(--color-marca)] transition-all duration-300 sm:w-fit sm:rounded-full ${
            mini ? "rounded-full" : "rounded-3xl"
          }`}
        >
          <div
            className={`grid grid-cols-5 gap-1 bg-[#0d0a1a] transition-all duration-300 sm:flex sm:rounded-full ${
              mini ? "rounded-full p-1" : "rounded-[22px] p-1.5"
            }`}
          >
            {SECCIONES.map((s) => {
              const activo = activa === s.clave;
              return (
                <Link
                  key={s.clave}
                  href={s.href}
                  aria-current={activo ? "page" : undefined}
                  title={s.texto}
                  className={`flex min-w-0 items-center justify-center border-2 font-semibold whitespace-nowrap transition-all duration-300 sm:flex-row sm:rounded-full ${
                    mini
                      ? "gap-1.5 rounded-full px-1 py-1 text-xs sm:px-3 sm:py-1"
                      : "flex-col gap-1 rounded-2xl px-1 py-1.5 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                  } ${activo ? s.activo : `border-transparent ${s.texto_} hover:bg-white/5`}`}
                >
                  <span
                    aria-hidden
                    className={`grid shrink-0 place-items-center rounded-full ring-1 transition-all duration-300 ${s.chip} ${
                      mini ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm"
                    }`}
                  >
                    {s.icono}
                  </span>
                  {/* Minimizado en el celular: solo el ícono */}
                  <span className={mini ? "sr-only sm:not-sr-only" : ""}>{s.texto}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
