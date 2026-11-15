"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO = "/video/intro.mp4";

/**
 * Se marca al terminar el video. Vive solo en la memoria de la pestaña:
 * cada vez que alguien abre o recarga la página, el video vuelve a salir.
 * Solo evita repetirlo si el visitante navega dentro de la web y regresa
 * a la portada sin recargar (p. ej. del checkout al inicio).
 */
let yaVistoEnEstaCarga = false;

/** Evento que avisa de que el video terminó y ya se ve el menú principal. */
export const EVENTO_INTRO_FIN = "daxsp:intro-fin";
export const introTerminada = () => yaVistoEnEstaCarga;

/**
 * Pantalla completa con el video de entrada. Al terminar el video,
 * se desvanece y aparece la página principal. Si el video falla, se muestra la página.
 */
export function VideoIntro() {
  const video = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<"viendo" | "saliendo" | "fuera">("viendo");
  const [silenciado, setSilenciado] = useState(false);
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    if (yaVistoEnEstaCarga) return setEstado("fuera");

    document.documentElement.style.overflow = "hidden";
    const v = video.current;
    if (!v) return;
    // Intentar con sonido; si el navegador lo bloquea, reproducir en silencio
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setSilenciado(true);
      v.play().catch(() => terminar());
    });
    return () => {
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function terminar() {
    yaVistoEnEstaCarga = true;
    document.documentElement.style.overflow = "";
    setEstado("saliendo");
    setTimeout(() => {
      setEstado("fuera");
      window.dispatchEvent(new Event(EVENTO_INTRO_FIN));
    }, 700);
  }

  function activarSonido() {
    const v = video.current;
    if (!v) return;
    v.muted = false;
    setSilenciado(false);
    v.play().catch(() => {});
  }

  if (estado === "fuera") return null;

  return (
    <div
      id="video-intro"
      role="dialog"
      aria-label="Video de bienvenida"
      className={`fixed inset-0 z-[100] flex flex-col bg-black transition-opacity duration-700 ${
        estado === "saliendo" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Resplandor de marca a los lados en pantallas anchas */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,.35),transparent_60%)]" />

      {/* El video ocupa el espacio disponible; el botón va DEBAJO, sin taparlo */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center sm:pt-6">
        <video
          ref={video}
          src={VIDEO}
          playsInline
          preload="auto"
          onEnded={terminar}
          onError={terminar}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgreso(v.currentTime / v.duration);
          }}
          className="h-full max-h-full w-full object-contain sm:w-auto sm:max-w-[92vw] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-[0_0_120px_-20px_var(--color-marca)]"
        />

        {silenciado && (
          <button
            onClick={activarSonido}
            className="absolute top-[max(1.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 animate-pulse rounded-full bg-white/90 px-5 py-3 text-sm font-semibold whitespace-nowrap text-black shadow-xl"
          >
            🔊 Toca para activar el sonido
          </button>
        )}
      </div>

      {/* Para quien no quiere esperar a que termine el video */}
      <div className="relative flex shrink-0 justify-center px-4 pt-3 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] sm:pt-4 sm:pb-5">
        <button
          onClick={terminar}
          className="group relative w-full max-w-xs overflow-hidden rounded-full bg-linear-to-r from-marca-2 via-marca to-acento p-[2px] shadow-[0_0_40px_-6px_var(--color-marca)] transition hover:shadow-[0_0_60px_-4px_var(--color-marca)] active:scale-[.97]"
        >
          <span className="relative flex items-center justify-center gap-3 rounded-full bg-black/55 px-7 py-3.5 font-display text-lg font-bold tracking-wide text-white backdrop-blur transition group-hover:bg-black/30">
            {/* Brillo que recorre el botón */}
            <span aria-hidden className="brillo-boton pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/25 to-transparent" />
            Entrar
            <span
              aria-hidden
              className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm text-black transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15" aria-hidden>
        <div className="h-full bg-linear-to-r from-marca-2 via-marca to-acento" style={{ width: `${progreso * 100}%` }} />
      </div>
    </div>
  );
}
