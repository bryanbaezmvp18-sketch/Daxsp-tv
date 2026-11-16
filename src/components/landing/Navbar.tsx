import Link from "next/link";
import { marca } from "@/config/curso";
import { LogoAnimado } from "@/components/marca/Banner";
import { BotonComprar } from "./BotonComprar";
import { CabeceraPortada } from "./MenuPortada";
import type { Precios } from "@/lib/precios-tipos";

/**
 * Cabecera de la portada con el mismo estilo del panel: banner con fondo de
 * marca, logo animado y menú en cápsula de colores.
 */
export function Navbar({ p }: { p: Precios }) {
  return (
    <CabeceraPortada
      filaLogo={
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:gap-4 sm:py-6">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={marca.nombre}>
            <LogoAnimado className="h-12 w-12 sm:h-16 sm:w-16" />
            <span className="min-w-0">
              <span className="block font-display text-xl font-bold sm:text-2xl">{marca.nombre}</span>
              <span className="mt-1 block truncate text-[8.5px] tracking-[0.25em] text-suave/80 uppercase sm:text-[10px] sm:tracking-[0.35em]">
                {marca.eslogan}
              </span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/entrar"
              className="flex items-center gap-1.5 rounded-full border border-red-400/50 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-100 shadow-[0_0_14px_-6px_rgba(239,68,68,.8)] transition hover:bg-red-500/25 active:scale-95 sm:text-sm"
            >
              <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-red-500/30 text-[10px]">
                👤
              </span>
              Mi cuenta
            </Link>
            <BotonComprar p={p} compacto className="hidden! sm:inline-flex!" />
          </div>
        </div>
      }
    />
  );
}
