import Link from "next/link";
import { marca } from "@/config/curso";
import { Logo } from "@/components/landing/Logo";
import { BotonSalir } from "@/components/BotonSalir";
import { RelojSesion } from "./RelojSesion";

type Seccion = "pedidos" | "curso" | "precios" | "cuentas" | "administradores";

const SECCIONES: { href: string; texto: string; clave: Seccion }[] = [
  { href: "/admin", texto: "Pedidos", clave: "pedidos" },
  { href: "/admin/curso", texto: "Curso", clave: "curso" },
  { href: "/admin/precios", texto: "Precios", clave: "precios" },
  { href: "/admin/cuentas", texto: "Cuentas", clave: "cuentas" },
  { href: "/admin/administradores", texto: "Admins", clave: "administradores" },
];

/** Cabecera del panel. En móvil las secciones pasan a una segunda fila desplazable. */
export function CabeceraAdmin({ email, activa, expira }: { email: string; activa: Seccion; expira: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-borde/60 bg-fondo/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4">
        <Link href="/admin" className="flex h-14 items-center gap-2 font-display text-lg font-bold">
          <Logo /> {marca.nombre}
          <span className="rounded-md bg-marca/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-marca-2 uppercase">Admin</span>
        </Link>
        <div className="ml-auto flex h-14 items-center gap-4 text-sm md:order-last">
          <span className="hidden max-w-48 truncate text-suave lg:inline" title={email}>{email}</span>
          <RelojSesion expira={expira} />
          <BotonSalir />
        </div>
        <nav className="-mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-t border-borde/60 px-3 py-2 text-sm md:mx-0 md:w-auto md:border-0 md:p-0" aria-label="Secciones del panel">
          {SECCIONES.map((s) => (
            <Link
              key={s.clave}
              href={s.href}
              aria-current={activa === s.clave ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 transition ${
                activa === s.clave ? "bg-marca/15 font-semibold text-texto" : "text-suave hover:text-texto"
              }`}
            >
              {s.texto}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
