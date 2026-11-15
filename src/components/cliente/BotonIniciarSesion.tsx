"use client";

import { useEffect, useState } from "react";
import { entrarConGoogle, mensajeErrorGoogle } from "@/lib/google-cliente";

type Sesion = { sesion: false } | { sesion: true; nombre: string; fotoURL: string | null; destino: string };

/**
 * «¿Ya tienes cuenta? Iniciar sesión»
 * - Mismo dispositivo con sesión guardada → «Entrar como Ana» y entra directo.
 * - Dispositivo nuevo → abre Google para elegir la cuenta (Google pide la
 *   contraseña si ese Gmail no está abierto en ese dispositivo).
 */
export function BotonIniciarSesion() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cliente/estado", { cache: "no-store" })
      .then((r) => r.json())
      .then(setSesion)
      .catch(() => setSesion({ sesion: false }));
  }, []);

  async function entrar() {
    setError("");
    // Dispositivo conocido: directo a su cuenta
    if (sesion?.sesion) {
      window.location.href = sesion.destino;
      return;
    }
    // Dispositivo nuevo: Google (se abre en el mismo clic para que el navegador no bloquee la ventana)
    setCargando(true);
    try {
      const destino = await entrarConGoogle();
      if (destino) window.location.href = destino;
    } catch (e) {
      setError(mensajeErrorGoogle(e));
      setCargando(false);
    }
  }

  const conocido = sesion?.sesion === true;

  return (
    <div className="mx-auto mt-5 max-w-md lg:mx-0">
      <button
        type="button"
        onClick={entrar}
        disabled={cargando}
        className="group flex w-full items-center gap-3 rounded-2xl border border-marca-2/30 bg-linear-to-r from-marca-2/10 via-marca/10 to-acento/10 px-4 py-3 text-left transition hover:border-marca-2/60 hover:from-marca-2/20 hover:via-marca/20 hover:to-acento/20 active:scale-[.99] disabled:opacity-70"
      >
        {conocido && sesion.fotoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sesion.fotoURL} alt="" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-marca-2/60" />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-marca-2/15 text-lg ring-2 ring-marca-2/30" aria-hidden>
            {conocido ? sesion.nombre.charAt(0).toUpperCase() : "👤"}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-suave">{conocido ? "Bienvenido de nuevo" : "¿Ya tienes cuenta?"}</span>
          <span className="block truncate font-display text-base font-bold text-texto">
            {cargando ? "Conectando con Google…" : conocido ? `Entrar como ${sesion.nombre}` : "Iniciar sesión"}
          </span>
        </span>
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-marca-2 text-black transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </button>
      {error && <p role="alert" className="mt-2 text-center text-sm text-red-300 lg:text-left">{error}</p>}
    </div>
  );
}
