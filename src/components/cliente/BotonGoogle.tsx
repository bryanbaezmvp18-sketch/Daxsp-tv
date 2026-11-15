"use client";

import { useEffect, useState } from "react";
import { entrarConGoogle, mensajeErrorGoogle, terminarRedireccion } from "@/lib/google-cliente";

const ESTILOS = {
  blanco: "bg-white text-[#1f1f1f] shadow-lg shadow-black/30 hover:bg-white/90",
  contorno: "border border-white/40 bg-black/40 text-white backdrop-blur hover:bg-white/10",
};

/**
 * Botón de Google (abre el panel de Google). Al entrar redirige según el estado
 * de compra. Se usa con distintos textos: «Registrarse con Google», «Entrar»...
 */
export function BotonGoogle({
  next,
  className = "",
  texto = "Continuar con Google",
  variante = "blanco",
  logo = true,
  procesarRetorno = true,
}: {
  next?: string;
  className?: string;
  texto?: string;
  variante?: keyof typeof ESTILOS;
  logo?: boolean;
  /** Solo un botón por página debe terminar la vuelta de la redirección de Google */
  procesarRetorno?: boolean;
}) {
  const [estado, setEstado] = useState<"" | "cargando">("");
  const [error, setError] = useState("");

  const ir = (destino: string) => {
    // Si venía de una página concreta (p. ej. /mi-cuenta) y ya compró, vuelve ahí
    window.location.href = next && destino !== "/checkout" ? next : destino;
  };

  // Vuelta de la redirección de Google (móviles que bloquean la ventana emergente)
  useEffect(() => {
    if (!procesarRetorno) return;
    terminarRedireccion()
      .then((d) => d && ir(d))
      .catch((e) => setError(mensajeErrorGoogle(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function entrar() {
    setError("");
    setEstado("cargando");
    try {
      const destino = await entrarConGoogle();
      if (destino) ir(destino);
    } catch (e) {
      setError(mensajeErrorGoogle(e));
      setEstado("");
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={entrar}
        disabled={estado === "cargando"}
        className={`inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 font-semibold transition active:scale-[.98] disabled:opacity-70 sm:w-auto ${ESTILOS[variante]}`}
      >
        {logo && <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>}
        {estado === "cargando" ? "Conectando…" : texto}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-black/60 px-3 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
