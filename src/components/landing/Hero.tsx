import { curso, precio, formatoUSD } from "@/config/curso";
import { MockupTelefono } from "./MockupTelefono";
import { BotonGoogle } from "@/components/cliente/BotonGoogle";
import { BotonIniciarSesion } from "@/components/cliente/BotonIniciarSesion";
import { BannerOferta } from "./BannerOferta";
import type { Precios } from "@/lib/precios-tipos";

export function Hero({ p }: { p: Precios }) {
  return (
    <section className="relative overflow-hidden">
      {/* Resplandores de fondo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-marca/25 blur-[120px]" />
        <div className="absolute top-40 -right-40 h-80 w-80 rounded-full bg-marca-2/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.15fr_.85fr] lg:pt-24 lg:pb-20">
        <div className="text-center lg:text-left">
          <span className="etiqueta">✨ Curso online · Método faceless</span>
          <h1 className="mt-5 font-display text-[2.15rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {curso.titulo.split(".")[0]}.{" "}
            <span className="texto-degradado">{curso.titulo.split(".").slice(1).join(".").trim()}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-suave sm:text-lg lg:mx-0">{curso.subtitulo}</p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center lg:justify-start">
            <BotonGoogle texto="Registrarse con Google" />
            <BotonIniciarSesion />
            <a
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-3.5 text-base font-bold whitespace-nowrap text-black shadow-md shadow-black/40 transition hover:bg-yellow-300 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
              Comprar curso
              <span className="rounded-full bg-black px-2 py-0.5 text-sm font-bold text-yellow-400">{formatoUSD(p.usd)}</span>
            </a>
          </div>
          <BannerOferta p={p} />

          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-suave lg:justify-start">
            {precio.pagoUnico && <li>✓ Pago único</li>}
            {precio.garantiaDias > 0 && <li>✓ Garantía de {precio.garantiaDias} días</li>}
            <li>✓ Tarjeta, PayPal o transferencia</li>
            <li>✓ Acceso de por vida</li>
          </ul>
        </div>

        <MockupTelefono />
      </div>
    </section>
  );
}
