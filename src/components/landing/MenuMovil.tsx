"use client";

import { useEffect, useState } from "react";

/** Menú desplegable para móvil y tablet (oculto en pantallas grandes). */
export function MenuMovil({ enlaces }: { enlaces: { href: string; texto: string }[] }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [abierto]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        className="grid h-10 w-10 place-items-center rounded-full border border-borde bg-white/5 transition hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {abierto && (
        <>
          <button aria-hidden tabIndex={-1} onClick={() => setAbierto(false)} className="fixed inset-0 top-16 z-40 cursor-default bg-black/50" />
          <div id="menu-movil" className="absolute inset-x-0 top-16 z-50 border-b border-borde bg-fondo/95 backdrop-blur-xl">
            <ul className="mx-auto max-w-6xl px-4 py-3">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <a href={e.href} onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-3.5 text-base hover:bg-white/5">
                    {e.texto}
                  </a>
                </li>
              ))}
              <li>
                <a href="/entrar" className="block rounded-xl px-3 py-3.5 text-base text-suave hover:bg-white/5">
                  Mi cuenta
                </a>
              </li>
              <li className="pt-2 pb-1">
                <a href="#precio" onClick={() => setAbierto(false)} className="btn-primario w-full">
                  Comprar ahora
                </a>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
