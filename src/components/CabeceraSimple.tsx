import Link from "next/link";
import { marca } from "@/config/curso";
import { Logo } from "@/components/landing/Logo";

export function CabeceraSimple({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-borde/60 bg-fondo/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Logo /> {marca.nombre}
        </Link>
        <nav className="flex items-center gap-4 text-sm">{children}</nav>
      </div>
    </header>
  );
}
