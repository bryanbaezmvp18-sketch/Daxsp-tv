"use client";

import { useEffect, useState } from "react";
import { useMinimizado } from "@/components/marca/useMinimizado";
import { FondoBanner } from "@/components/marca/Banner";

type Clave = "como-funciona" | "temario" | "precio" | "faq" | "comprar";

/** Cada enlace con su color (como el menú del panel). «Comprar» siempre resaltado en amarillo. */
const ENLACES: { href: string; clave: Clave; texto: string; corto: string; icono: string; chip: string; color: string; activo: string }[] = [
  {
    href: "#como-funciona", clave: "como-funciona", texto: "Cómo funciona", corto: "Cómo va", icono: "🎬",
    chip: "bg-cyan-400/20 ring-cyan-400/50", color: "text-cyan-200",
    activo: "border-cyan-400 bg-cyan-400/20 text-white shadow-[0_0_18px_-2px_rgba(34,211,238,.8)]",
  },
  {
    href: "#temario", clave: "temario", texto: "Temario", corto: "Temario", icono: "📚",
    chip: "bg-violet-400/20 ring-violet-400/50", color: "text-violet-200",
    activo: "border-violet-400 bg-violet-400/20 text-white shadow-[0_0_18px_-2px_rgba(167,139,250,.8)]",
  },
  {
    href: "#precio", clave: "precio", texto: "Precio", corto: "Precio", icono: "💲",
    chip: "bg-emerald-400/20 ring-emerald-400/50", color: "text-emerald-200",
    activo: "border-emerald-400 bg-emerald-400/20 text-white shadow-[0_0_18px_-2px_rgba(52,211,153,.8)]",
  },
  {
    href: "#faq", clave: "faq", texto: "Preguntas", corto: "Dudas", icono: "❓",
    chip: "bg-pink-400/20 ring-pink-400/50", color: "text-pink-200",
    activo: "border-pink-400 bg-pink-400/20 text-white shadow-[0_0_18px_-2px_rgba(244,114,182,.8)]",
  },
  {
    href: "/checkout", clave: "comprar", texto: "Comprar", corto: "Comprar", icono: "🛒",
    chip: "bg-black/20 ring-black/30", color: "text-black",
    activo: "",
  },
];

/** Qué sección se está viendo (para resaltarla en el menú). */
function useSeccionVisible() {
  const [visible, setVisible] = useState<Clave | null>(null);
  useEffect(() => {
    const ids: Clave[] = ["como-funciona", "temario", "precio", "faq"];
    const elementos = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!elementos.length) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        const en = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (en) setVisible(en.target.id as Clave);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    elementos.forEach((e) => obs.observe(e));
    const arriba = () => window.scrollY < 300 && setVisible(null);
    window.addEventListener("scroll", arriba, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", arriba);
    };
  }, []);
  return visible;
}

/** La cápsula de colores con los 5 enlaces (se usa dentro del banner en el celular y debajo en la computadora). */
function Capsula({ mini, visible, translucida = false }: { mini: boolean; visible: Clave | null; translucida?: boolean }) {
  return (
    <div
      className={`w-full bg-[linear-gradient(110deg,#22d3ee,#8b5cf6,#f472b6,#f59e0b,#22d3ee)] p-[2px] transition-all duration-300 sm:w-fit sm:rounded-full ${
        mini ? "rounded-full opacity-95 shadow-[0_0_10px_-6px_var(--color-marca)]" : "rounded-3xl shadow-[0_0_28px_-6px_var(--color-marca)]"
      }`}
    >
      <div
        className={`grid grid-cols-5 gap-1 transition-all duration-300 sm:flex sm:rounded-full ${
          translucida ? "bg-[#05030c]/95 backdrop-blur" : "bg-[#05030c]"
        } ${mini ? "rounded-full p-0.5" : "rounded-[22px] p-1.5"}`}
      >
        {ENLACES.map((e) => {
          const comprar = e.clave === "comprar";
          const activo = !comprar && visible === e.clave;
          return (
            <a
              key={e.clave}
              href={e.href}
              aria-current={activo ? "location" : undefined}
              title={e.texto}
              className={`flex min-w-0 items-center justify-center border-2 font-semibold whitespace-nowrap transition-all duration-300 sm:flex-row sm:rounded-full ${
                mini
                  ? "gap-1.5 rounded-full px-1 py-0.5 text-xs sm:px-3 sm:py-1"
                  : "flex-col gap-1 rounded-2xl px-1 py-1.5 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
              } ${
                comprar
                  ? "border-yellow-300 bg-yellow-400 text-black shadow-[0_0_18px_-4px_rgba(250,204,21,.9)] hover:bg-yellow-300"
                  : activo
                    ? e.activo
                    : `border-transparent ${e.color} hover:bg-white/5`
              }`}
            >
              <span
                aria-hidden
                className={`grid shrink-0 place-items-center rounded-full ring-1 transition-all duration-300 ${e.chip} ${
                  mini ? "h-5 w-5 text-[10px] sm:h-6 sm:w-6 sm:text-xs" : "h-7 w-7 text-sm"
                }`}
              >
                {e.icono}
              </span>
              <span className={mini ? "sr-only sm:not-sr-only" : ""}>
                <span className="sm:hidden">{e.corto}</span>
                <span className="hidden sm:inline">{e.texto}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Cabecera de la portada: banner con fondo de marca y logo animado.
 * - Celular: el menú va DENTRO del banner; todo queda fijo arriba y, al bajar,
 *   la fila del logo se esconde y el menú queda solo con íconos.
 * - Computadora: el menú va en una franja fija debajo del banner.
 */
export function CabeceraPortada({ filaLogo }: { filaLogo: React.ReactNode }) {
  const mini = useMinimizado(200);
  const visible = useSeccionVisible();

  return (
    <>
      <header className="sticky top-0 z-40 overflow-hidden border-b-2 border-marca/70 bg-[#07050f] sm:static sm:z-auto">
        <FondoBanner />
        {/* Fila del logo: en el celular se pliega al bajar */}
        <div
          className={`relative grid transition-all duration-300 sm:grid-rows-[1fr] sm:opacity-100 ${
            mini ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">{filaLogo}</div>
        </div>
        {/* Menú dentro del banner (solo celular) */}
        <div className={`relative px-4 transition-all duration-300 sm:hidden ${mini ? "py-1" : "pb-3"}`}>
          <Capsula mini={mini} visible={visible} translucida />
        </div>
      </header>

      {/* Computadora: franja fija debajo del banner */}
      <nav
        aria-label="Secciones de la página"
        className={`sticky top-0 z-40 hidden border-b border-marca/30 bg-[#0b0816]/90 backdrop-blur-xl transition-[padding] duration-300 sm:block ${mini ? "py-1" : "py-3"}`}
      >
        <div className="mx-auto flex max-w-6xl justify-center px-4 lg:justify-start">
          <Capsula mini={mini} visible={visible} />
        </div>
      </nav>
    </>
  );
}
