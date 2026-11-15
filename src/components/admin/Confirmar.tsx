"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Opciones {
  titulo: string;
  mensaje?: React.ReactNode;
  boton?: string;
  peligro?: boolean;
}

type Confirmar = (o: Opciones) => Promise<boolean>;

const Contexto = createContext<Confirmar | null>(null);

/**
 * Confirmación dentro de la página. Sustituye a window.confirm(), que algunos
 * navegadores y vistas previas bloquean sin avisar (y el botón "no hace nada").
 */
export function ProveedorConfirmar({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState<Opciones | null>(null);
  const resolver = useRef<(v: boolean) => void>(() => {});
  const botonOk = useRef<HTMLButtonElement>(null);

  const confirmar = useCallback<Confirmar>((o) => {
    setAbierto(o);
    return new Promise<boolean>((ok) => {
      resolver.current = ok;
    });
  }, []);

  const cerrar = (v: boolean) => {
    setAbierto(null);
    resolver.current(v);
  };

  useEffect(() => {
    if (!abierto) return;
    botonOk.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar(false);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      {abierto &&
        createPortal(
          <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => cerrar(false)}>
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirmar-titulo"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-borde bg-superficie p-6 shadow-2xl"
            >
              <h2 id="confirmar-titulo" className="font-display text-lg font-bold">{abierto.titulo}</h2>
              {abierto.mensaje && <div className="mt-2 text-sm text-suave">{abierto.mensaje}</div>}
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => cerrar(false)} className="rounded-full border border-borde px-4 py-2 text-sm text-suave hover:text-texto">
                  Cancelar
                </button>
                <button
                  ref={botonOk}
                  onClick={() => cerrar(true)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold ${
                    abierto.peligro ? "bg-red-500 text-white hover:bg-red-400" : "bg-linear-to-r from-marca to-acento text-white hover:brightness-110"
                  }`}
                >
                  {abierto.boton ?? "Confirmar"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Contexto.Provider>
  );
}

export function useConfirmar(): Confirmar {
  const c = useContext(Contexto);
  if (!c) throw new Error("useConfirmar debe usarse dentro de <ProveedorConfirmar>");
  return c;
}
