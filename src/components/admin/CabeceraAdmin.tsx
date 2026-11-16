import Link from "next/link";
import { marca } from "@/config/curso";
import { FondoBanner, LogoAnimado } from "@/components/marca/Banner";
import { BotonSalir } from "@/components/BotonSalir";
import { RelojSesion } from "./RelojSesion";
import { MenuAdmin, type Seccion } from "./MenuAdmin";

/**
 * Cabecera del panel: banner con fondo de marca (marca de agua, brillos y el
 * logo «D» difuminado), logo animado y el menú dentro de una cápsula con borde
 * luminoso. El menú se queda fijo arriba al desplazarse.
 */
export function CabeceraAdmin({ email, activa, expira }: { email: string; activa: Seccion; expira: number }) {
  return (
    <>
      {/* ── Banner con fondo ── */}
      <header className="relative overflow-hidden border-b-2 border-marca/70 bg-[#07050f]">
        <FondoBanner />

        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap sm:py-6">
          <Link href="/admin" className="flex min-w-0 items-center gap-3" aria-label={`${marca.nombre} · panel`}>
            <LogoAnimado />
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
                {marca.nombre}
                <span className="rounded-md border border-marca-2/60 bg-marca-2/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-marca-2 uppercase">
                  Admin
                </span>
              </span>
              <span className="mt-1 block text-[8.5px] tracking-[0.25em] text-suave/80 uppercase sm:text-[10px] sm:tracking-[0.35em]">
                <span className="hidden sm:inline">Panel de control · </span>Crea · Vende · Administra
              </span>
            </span>
          </Link>

          {/* En el celular baja a su propia fila: correo, reloj y salir */}
          <div className="flex w-full items-center gap-2 text-sm sm:ml-auto sm:w-auto sm:gap-3">
            <span
              className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 sm:max-w-64 sm:flex-none sm:text-sm"
              title={email}
            >
              <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-400/25 text-[10px]">
                ✉️
              </span>
              <span className="truncate">{email}</span>
            </span>
            <RelojSesion expira={expira} />
            <BotonSalir className="flex shrink-0 items-center gap-1.5 rounded-full bg-linear-to-r from-rose-500 to-pink-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_16px_-4px_rgba(244,63,94,.9)] transition hover:brightness-110 active:scale-95 disabled:opacity-60 sm:text-sm" />
          </div>
        </div>
      </header>

      {/* ── Menú en cápsula luminosa (fijo arriba, se minimiza al bajar) ── */}
      <MenuAdmin activa={activa} />
    </>
  );
}
