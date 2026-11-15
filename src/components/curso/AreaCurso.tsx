"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Leccion, Modulo } from "@/lib/tipos";

export function AreaCurso({ modulos, completadasIniciales }: { modulos: Modulo[]; completadasIniciales: string[] }) {
  const lecciones = useMemo(() => modulos.flatMap((m) => m.lecciones ?? []), [modulos]);
  const [completadas, setCompletadas] = useState(() => new Set(completadasIniciales));
  const [actual, setActual] = useState<Leccion>(
    () => lecciones.find((l) => !completadasIniciales.includes(l.id)) ?? lecciones[0],
  );
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const reanudarEn = useRef(0);
  const reintentos = useRef(0);

  const pedirUrl = useCallback(async (l: Leccion) => {
    setError("");
    const res = await fetch(`/api/leccion/${encodeURIComponent(l.id)}`, { cache: "no-store" });
    if (res.status === 401) return void (window.location.href = "/mi-cuenta");
    if (!res.ok) return setError("No pudimos cargar esta lección. Recarga la página.");
    setUrl((await res.json()).url);
  }, []);

  useEffect(() => {
    setUrl(null);
    reanudarEn.current = 0;
    reintentos.current = 0;
    if (actual) pedirUrl(actual);
  }, [actual, pedirUrl]);

  // La URL caduca a los 15 min: si el video falla, pedimos otra y seguimos donde iba
  function alFallarVideo() {
    if (reintentos.current >= 2) return setError("No pudimos reproducir el video. Recarga la página.");
    reintentos.current += 1;
    reanudarEn.current = video.current?.currentTime ?? 0;
    pedirUrl(actual);
  }

  async function marcar(l: Leccion, completada: boolean) {
    setCompletadas((prev) => {
      const s = new Set(prev);
      if (completada) s.add(l.id);
      else s.delete(l.id);
      return s;
    });
    await fetch("/api/progreso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leccionId: l.id, completada }),
    }).catch(() => {});
  }

  const indice = lecciones.findIndex((l) => l.id === actual?.id);
  const siguiente = lecciones[indice + 1];
  const porcentaje = lecciones.length ? Math.round((completadas.size / lecciones.length) * 100) : 0;
  const hecha = completadas.has(actual?.id);

  function irA(l: Leccion) {
    setActual(l);
    setListaAbierta(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!actual) return null;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Reproductor */}
      <section>
        <div className="overflow-hidden rounded-2xl border border-borde bg-black">
          {actual.tipo === "video" ? (
            <div className="aspect-video">
              {url ? (
                <video
                  ref={video}
                  key={actual.id}
                  src={url}
                  controls
                  playsInline
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  onLoadedMetadata={(e) => {
                    if (reanudarEn.current) e.currentTarget.currentTime = reanudarEn.current;
                  }}
                  onError={alFallarVideo}
                  onEnded={() => !hecha && marcar(actual, true)}
                  className="h-full w-full"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-suave">{error || "Cargando…"}</div>
              )}
            </div>
          ) : (
            <div className="grid aspect-video place-items-center bg-superficie p-6 text-center">
              <div>
                <div className="text-5xl" aria-hidden>📄</div>
                <p className="mt-3 font-semibold">{actual.titulo}</p>
                <p className="mt-1 text-sm text-suave">Material descargable en PDF</p>
                {url ? (
                  <a href={url} className="btn-primario mt-5" onClick={() => !hecha && marcar(actual, true)}>
                    Descargar PDF
                  </a>
                ) : (
                  <p className="mt-5 text-sm text-suave">{error || "Preparando descarga…"}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs tracking-wider text-suave uppercase">
              Lección {indice + 1} de {lecciones.length}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">{actual.titulo}</h2>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => marcar(actual, !hecha)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                hecha ? "border-marca-2/50 bg-marca-2/15 text-marca-2" : "border-borde bg-white/5 hover:bg-white/10"
              }`}
            >
              {hecha ? "✓ Completada" : "Marcar como completada"}
            </button>
            {siguiente && (
              <button onClick={() => irA(siguiente)} className="btn-primario px-4! py-2! text-sm">
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Temario */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="tarjeta p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Tu progreso</span>
            <span className="text-suave">{porcentaje}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-linear-to-r from-marca-2 via-marca to-acento transition-all" style={{ width: `${porcentaje}%` }} />
          </div>
          <button
            onClick={() => setListaAbierta((a) => !a)}
            className="mt-4 w-full rounded-xl border border-borde py-2 text-sm lg:hidden"
            aria-expanded={listaAbierta}
          >
            {listaAbierta ? "Ocultar lecciones" : "Ver todas las lecciones"}
          </button>
        </div>

        <nav className={`mt-3 space-y-3 ${listaAbierta ? "" : "hidden lg:block"}`} aria-label="Lecciones">
          {modulos.map((m) => (
            <div key={m.id} className="tarjeta overflow-hidden">
              <h3 className="border-b border-borde px-4 py-3 text-sm font-semibold">{m.titulo}</h3>
              <ul>
                {(m.lecciones ?? []).map((l) => {
                  const activa = l.id === actual.id;
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => irA(l)}
                        aria-current={activa ? "true" : undefined}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                          activa ? "bg-marca/15" : "hover:bg-white/5"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                            completadas.has(l.id) ? "bg-marca-2 text-black" : "border border-borde"
                          }`}
                          aria-label={completadas.has(l.id) ? "Completada" : "Pendiente"}
                        >
                          {completadas.has(l.id) ? "✓" : ""}
                        </span>
                        <span className="flex-1">{l.titulo}</span>
                        <span className="shrink-0 text-xs text-suave">{l.tipo === "pdf" ? "PDF" : l.duracion ?? "▶"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
