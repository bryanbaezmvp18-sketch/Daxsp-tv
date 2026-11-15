import Link from "next/link";
import { marca } from "@/config/curso";
import { Logo } from "@/components/landing/Logo";

export function TarjetaAuth({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-marca/20 blur-[120px]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold">
          <Logo /> {marca.nombre}
        </Link>
        <div className="tarjeta p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">{titulo}</h1>
          <p className="mt-1 mb-6 text-sm text-suave">{subtitulo}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
