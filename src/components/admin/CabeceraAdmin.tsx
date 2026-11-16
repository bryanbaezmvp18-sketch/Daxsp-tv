import Link from "next/link";
import { marca } from "@/config/curso";
import { Logo } from "@/components/landing/Logo";
import { BotonSalir } from "@/components/BotonSalir";
import { RelojSesion } from "./RelojSesion";
import { MenuAdmin, type Seccion } from "./MenuAdmin";

/** Logo con anillo de colores que gira y un resplandor que respira. */
function LogoAnimado() {
  return (
    <span className="relative grid h-14 w-14 shrink-0 place-items-center sm:h-16 sm:w-16">
      <span aria-hidden className="absolute inset-0 animate-pulse rounded-2xl bg-marca/40 blur-xl [animation-duration:2.5s]" />
      <span
        aria-hidden
        className="absolute inset-0 animate-spin rounded-2xl bg-[conic-gradient(from_0deg,#22d3ee,#8b5cf6,#f472b6,#f59e0b,#22d3ee)] [animation-duration:6s]"
      />
      <span className="relative grid h-[calc(100%-4px)] w-[calc(100%-4px)] place-items-center rounded-[14px] bg-[#0d0a18]">
        <Logo className="h-9 w-9 sm:h-10 sm:w-10" />
      </span>
    </span>
  );
}

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
        {/* Fondo: brillos de color */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-marca/35 blur-[90px]" />
          <div className="absolute -right-10 -bottom-28 h-72 w-96 rounded-full bg-marca-2/25 blur-[90px]" />
          <div className="absolute top-0 left-1/2 h-40 w-[40rem] -translate-x-1/2 rounded-full bg-acento/10 blur-[80px]" />
        </div>
        {/* Fondo: cuadrícula sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]"
        />
        {/* Fondo: marca de agua gigante */}
        <p
          aria-hidden
          className="pointer-events-none absolute -top-3 left-24 font-display text-[5.5rem] leading-none font-black tracking-tighter whitespace-nowrap text-transparent italic select-none [-webkit-text-stroke:1.5px_rgba(139,92,246,.35)] sm:left-40 sm:text-[8rem]"
        >
          DAXSP TV
        </p>
        {/* Fondo: logo «D» difuminado a la derecha */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 -right-10 h-40 w-40 -translate-y-1/2 rotate-12 bg-[url('/instructor.jpeg')] bg-cover bg-center opacity-20 mix-blend-screen [mask-image:radial-gradient(circle,#000_45%,transparent_72%)] sm:-right-8 sm:h-56 sm:w-56 sm:opacity-25"
        />

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
