"use client";

import { useEffect, useState } from "react";
import { BotonCopiar } from "@/components/checkout/BotonCopiar";

interface Material {
  id: string;
  titulo: string;
  archivo: string;
  carpeta: string;
  tipo: "guia" | "kit" | "plantilla" | "video" | "documento";
  esTexto: boolean;
  descripcion: string;
  bytes: number;
}

const SECCIONES: { tipo: Material["tipo"]; titulo: string; icono: string }[] = [
  { tipo: "guia", titulo: "Empieza aquí", icono: "📖" },
  { tipo: "kit", titulo: "Kit para Claude", icono: "🧩" },
  { tipo: "plantilla", titulo: "Plantillas y scripts", icono: "📝" },
  { tipo: "video", titulo: "Videos", icono: "🎬" },
  { tipo: "documento", titulo: "Documentos", icono: "📄" },
];

const tamano = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Pide al servidor la URL temporal (y el texto si aplica). */
async function pedir(id: string): Promise<{ url: string; texto: string | null }> {
  const res = await fetch(`/api/material/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 401) {
    window.location.href = "/mi-cuenta";
    throw new Error("sin acceso");
  }
  if (!res.ok) throw new Error("No se pudo abrir el archivo. Recarga la página.");
  return res.json();
}

export function Materiales({ materiales }: { materiales: Material[] }) {
  return (
    <div className="space-y-8">
      {SECCIONES.map((s, i) => {
        const items = materiales.filter((m) => m.tipo === s.tipo);
        if (!items.length) return null;
        const numero = SECCIONES.slice(0, i).filter((x) => materiales.some((m) => m.tipo === x.tipo)).length + 1;
        return (
          <section key={s.tipo} aria-labelledby={`sec-${s.tipo}`}>
            <h2 id={`sec-${s.tipo}`} className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-marca/20 text-sm text-marca-2">{numero}</span>
              {s.icono} {s.titulo}
            </h2>
            <div className="mt-3 space-y-3">
              {items.map((m) =>
                m.tipo === "guia" && m.esTexto ? (
                  <Guia key={m.id} m={m} />
                ) : m.tipo === "plantilla" ? (
                  <Plantilla key={m.id} m={m} />
                ) : m.tipo === "video" ? (
                  <Video key={m.id} m={m} />
                ) : (
                  <Descargable key={m.id} m={m} destacado={m.tipo === "kit"} />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Botón que pide la URL temporal en el momento de descargar. */
function BotonDescargar({ id, texto = "Descargar", primario = false }: { id: string; texto?: string; primario?: boolean }) {
  const [estado, setEstado] = useState<"" | "cargando" | "error">("");
  return (
    <button
      onClick={async () => {
        setEstado("cargando");
        try {
          const { url } = await pedir(id);
          window.location.href = url;
          setEstado("");
        } catch {
          setEstado("error");
        }
      }}
      disabled={estado === "cargando"}
      className={primario ? "btn-primario px-5! py-2.5! text-sm" : "rounded-full border border-borde px-4 py-2 text-sm hover:bg-white/5"}
    >
      {estado === "cargando" ? "Preparando…" : estado === "error" ? "Reintentar" : `⬇ ${texto}`}
    </button>
  );
}

function Cabecera({ m }: { m: Material }) {
  return (
    <div className="min-w-0">
      <h3 className="font-semibold">{m.titulo}</h3>
      <p className="mt-0.5 text-sm text-suave">{m.descripcion}</p>
      <p className="mt-1 truncate text-xs text-suave/80">
        {m.carpeta ? `${m.carpeta} / ` : ""}
        {m.archivo} · {tamano(m.bytes)}
      </p>
    </div>
  );
}

/** Guía: se lee directamente en la página (abierta por defecto). */
function Guia({ m }: { m: Material }) {
  const [texto, setTexto] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    pedir(m.id)
      .then((r) => setTexto(r.texto))
      .catch((e) => setError(e.message));
  }, [m.id]);

  return (
    <article className="tarjeta overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <Cabecera m={m} />
        <div className="shrink-0">
          <BotonDescargar id={m.id} primario />
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto border-t border-borde bg-black/20 px-4 py-4 sm:px-6">
        {texto !== null ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-texto/90 [overflow-wrap:anywhere]">{texto}</div>
        ) : (
          <p className="text-sm text-suave">{error || "Cargando…"}</p>
        )}
      </div>
    </article>
  );
}

/** Plantilla o script: se despliega para leerlo y copiarlo. */
function Plantilla({ m }: { m: Material }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function alternar() {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo && texto === null) {
      try {
        setTexto((await pedir(m.id)).texto ?? "");
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }

  return (
    <article className="tarjeta overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <Cabecera m={m} />
        <div className="flex shrink-0 gap-2">
          {m.esTexto && (
            <button onClick={alternar} aria-expanded={abierto} className="rounded-full border border-borde px-4 py-2 text-sm hover:bg-white/5">
              {abierto ? "Ocultar" : "Ver y copiar"}
            </button>
          )}
          <BotonDescargar id={m.id} />
        </div>
      </div>
      {abierto && (
        <div className="border-t border-borde bg-black/30">
          {texto ? (
            <>
              <div className="flex justify-end px-3 pt-3">
                <BotonCopiar valor={texto} etiqueta="Copiar todo" />
              </div>
              <pre className="max-h-[50vh] overflow-auto px-4 pt-2 pb-4 font-mono text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{texto}</pre>
            </>
          ) : (
            <p className="p-4 text-sm text-suave">{error || (texto === "" ? "Este archivo es muy grande para verlo aquí: descárgalo." : "Cargando…")}</p>
          )}
        </div>
      )}
    </article>
  );
}

/** Kit o documento: tarjeta con botón de descarga. */
function Descargable({ m, destacado }: { m: Material; destacado: boolean }) {
  return (
    <article className={`tarjeta flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${destacado ? "border-marca/50 bg-marca/5" : ""}`}>
      <Cabecera m={m} />
      <div className="shrink-0">
        <BotonDescargar id={m.id} texto={destacado ? "Descargar kit" : "Descargar"} primario={destacado} />
      </div>
    </article>
  );
}

function Video({ m }: { m: Material }) {
  const [url, setUrl] = useState<string | null>(null);
  return (
    <article className="tarjeta overflow-hidden">
      <div className="p-4">
        <Cabecera m={m} />
      </div>
      {url ? (
        <video src={url} controls playsInline controlsList="nodownload" className="aspect-video w-full bg-black" />
      ) : (
        <button onClick={async () => setUrl((await pedir(m.id)).url)} className="grid aspect-video w-full place-items-center bg-black/40 text-4xl" aria-label={`Reproducir ${m.titulo}`}>
          ▶
        </button>
      )}
    </article>
  );
}
