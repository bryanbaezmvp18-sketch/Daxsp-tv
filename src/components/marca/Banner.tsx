import { Logo } from "@/components/landing/Logo";

/** Logo con anillo de colores que gira y un resplandor que respira. */
export function LogoAnimado({ className = "h-14 w-14 sm:h-16 sm:w-16" }: { className?: string }) {
  return (
    <span className={`relative grid shrink-0 place-items-center ${className}`}>
      <span aria-hidden className="absolute inset-0 animate-pulse rounded-2xl bg-marca/40 blur-xl [animation-duration:2.5s]" />
      <span
        aria-hidden
        className="absolute inset-0 animate-spin rounded-2xl bg-[conic-gradient(from_0deg,#22d3ee,#8b5cf6,#f472b6,#f59e0b,#22d3ee)] [animation-duration:6s]"
      />
      <span className="relative grid h-[calc(100%-4px)] w-[calc(100%-4px)] place-items-center rounded-[14px] bg-[#0d0a18]">
        <Logo className="h-[62%] w-[62%]" />
      </span>
    </span>
  );
}

/**
 * Fondo de banner de la marca: brillos de color, cuadrícula, marca de agua
 * gigante «DAXSP TV» y el logo «D» difuminado a la derecha.
 * Va dentro de un contenedor `relative overflow-hidden`.
 */
export function FondoBanner() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-marca/35 blur-[90px]" />
        <div className="absolute -right-10 -bottom-28 h-72 w-96 rounded-full bg-marca-2/25 blur-[90px]" />
        <div className="absolute top-0 left-1/2 h-40 w-[40rem] -translate-x-1/2 rounded-full bg-acento/10 blur-[80px]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <p
        aria-hidden
        className="pointer-events-none absolute -top-3 left-24 font-display text-[5.5rem] leading-none font-black tracking-tighter whitespace-nowrap text-transparent italic select-none [-webkit-text-stroke:1.5px_rgba(139,92,246,.35)] sm:left-40 sm:text-[8rem]"
      >
        DAXSP TV
      </p>
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-10 h-40 w-40 -translate-y-1/2 rotate-12 bg-[url('/instructor.jpeg')] bg-cover bg-center opacity-20 mix-blend-screen [mask-image:radial-gradient(circle,#000_45%,transparent_72%)] sm:-right-8 sm:h-56 sm:w-56 sm:opacity-25"
      />
    </>
  );
}
