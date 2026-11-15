import { curso, precio, formatoUSD } from "@/config/curso";
import { MockupTelefono } from "./MockupTelefono";
import { BotonGoogle } from "@/components/cliente/BotonGoogle";
import { BotonIniciarSesion } from "@/components/cliente/BotonIniciarSesion";
import { BannerOferta } from "./BannerOferta";
import type { Precios } from "@/lib/precios-tipos";
import { BotonComprar } from "./BotonComprar";

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
            <BotonComprar p={p} texto="Comprar curso" />
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
