import Link from "next/link";
import { marca } from "@/config/curso";
import { Logo } from "./Logo";
import { MenuMovil } from "./MenuMovil";
import { BotonComprar } from "./BotonComprar";
import type { Precios } from "@/lib/precios-tipos";

export const enlacesNav = [
  { href: "#como-funciona", texto: "Cómo funciona" },
  { href: "#temario", texto: "Temario" },
  { href: "#precio", texto: "Precio" },
  { href: "#faq", texto: "Preguntas" },
];

export function Navbar({ p }: { p: Precios }) {
  return (
    <header className="sticky top-0 z-40 border-b border-borde/60 bg-fondo/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold" aria-label={marca.nombre}>
          <Logo />
          {marca.nombre}
        </Link>

        {/* Enlaces visibles solo en pantallas grandes */}
        <ul className="hidden items-center gap-7 text-sm text-suave lg:flex">
          {enlacesNav.map((e) => (
            <li key={e.href}>
              <a href={e.href} className="transition hover:text-texto">
                {e.texto}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/entrar" className="hidden text-sm text-suave hover:text-texto lg:inline">
            Mi cuenta
          </Link>
          <BotonComprar p={p} href="#precio" compacto className="hidden! sm:inline-flex!" />
          <MenuMovil enlaces={enlacesNav} p={p} />
        </div>
      </nav>
    </header>
  );
}
