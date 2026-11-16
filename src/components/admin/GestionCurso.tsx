"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConfirmar } from "./Confirmar";
import {
  descartarSubida,
  editarMaterial,
  eliminarMaterial,
  guardarMaterialNuevo,
  moverMaterial,
  prepararSubida,
  reemplazarArchivo,
  verMaterial,
} from "@/app/admin/curso/acciones";
import {
  DESCRIPCION_POR_TIPO,
  MAX_BYTES_MATERIAL,
  SECCIONES_MATERIAL,
  tamanoLegible,
  tipoSugerido,
  tituloSugerido,
  type TipoMaterial,
} from "@/lib/materiales-tipos";

export interface MaterialAdmin {
  id: string;
  titulo: string;
  descripcion: string;
  archivo: string;
  carpeta: string;
  tipo: TipoMaterial;
  bytes: number;
}

/**
 * Sube un archivo directo del navegador a Firebase Storage (carpeta privada del curso).
 * Usa un pase temporal de admin que da el servidor y cierra la sesión al terminar.
 */
async function subirArchivo(archivo: File, alProgreso: (p: number) => void): Promise<string> {
  const prep = await prepararSubida(archivo.name, archivo.size);
  if (!prep.ok) throw new Error(prep.error);

  const [{ clientAuth, clientStorage }, { signInWithCustomToken, signOut }, { ref, uploadBytesResumable }] = await Promise.all([
    import("@/lib/firebase/client"),
    import("firebase/auth"),
    import("firebase/storage"),
  ]);
  const auth = clientAuth();
  await signInWithCustomToken(auth, prep.pase);
  try {
    await new Promise<void>((ok, mal) => {
      const tarea = uploadBytesResumable(ref(clientStorage(), prep.ruta), archivo, { contentType: prep.contentType });
      tarea.on(
        "state_changed",
        (s) => alProgreso(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0),
        (e) => mal(new Error(e.code === "storage/unauthorized" ? "Firebase no dejó subir el archivo (permisos)." : "Se cortó la subida. Revisa tu internet e inténtalo de nuevo.")),
        () => ok(),
      );
    });
  } finally {
    await signOut(auth).catch(() => {});
  }
  return prep.ruta;
}

const campo =
  "w-full rounded-xl border border-borde bg-fondo px-3 py-2.5 text-sm text-texto outline-none transition placeholder:text-suave/50 focus:border-marca focus:ring-2 focus:ring-marca/30";

function SelectorSeccion({ valor, alCambiar }: { valor: TipoMaterial; alCambiar: (t: TipoMaterial) => void }) {
  return (
    <select value={valor} onChange={(e) => alCambiar(e.target.value as TipoMaterial)} className={campo}>
      {SECCIONES_MATERIAL.map((s) => (
        <option key={s.tipo} value={s.tipo}>
          {s.icono} {s.titulo}
        </option>
      ))}
    </select>
  );
}

function BarraProgreso({ valor }: { valor: number }) {
  return (
    <div className="mt-3">
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-linear-to-r from-marca-2 to-marca transition-[width]" style={{ width: `${Math.round(valor * 100)}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-suave">Subiendo… {Math.round(valor * 100)}%</p>
    </div>
  );
}

export function GestionCurso({ materiales }: { materiales: MaterialAdmin[] }) {
  const total = materiales.reduce((n, m) => n + m.bytes, 0);
  return (
    <div className="mt-6 space-y-8">
      <SubirNuevo />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold">Lo que tiene el curso ahora</h2>
        <p className="text-sm text-suave">
          {materiales.length} archivo{materiales.length === 1 ? "" : "s"}
          {total > 0 && ` · ${tamanoLegible(total)}`}
        </p>
      </div>

      {materiales.length === 0 && <p className="tarjeta p-8 text-center text-suave">Todavía no hay archivos. Sube el primero arriba.</p>}

      {SECCIONES_MATERIAL.map((s) => {
        const items = materiales.filter((m) => m.tipo === s.tipo);
        if (!items.length) return null;
        return (
          <section key={s.tipo} aria-labelledby={`adm-${s.tipo}`}>
            <h3 id={`adm-${s.tipo}`} className="font-display text-lg font-semibold">
              {s.icono} {s.titulo} <span className="text-sm font-normal text-suave">({items.length})</span>
            </h3>
            <p className="mb-3 text-xs text-suave">{s.ayuda}</p>
            <div className="space-y-2">
              {items.map((m, i) => (
                <FilaMaterial key={m.id} m={m} primero={i === 0} ultimo={i === items.length - 1} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ───────────── Subir archivo nuevo ───────────── */

function SubirNuevo() {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoMaterial>("documento");
  const [progreso, setProgreso] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  function elegir(f: File | undefined) {
    if (!f) return;
    setAviso(null);
    if (f.size > MAX_BYTES_MATERIAL) return setAviso({ ok: false, texto: "Ese archivo pesa más de 1 GB." });
    const t = tipoSugerido(f.name);
    setArchivo(f);
    setTipo(t);
    setTitulo(tituloSugerido(f.name));
    setDescripcion(DESCRIPCION_POR_TIPO[t]);
  }

  function limpiar() {
    setArchivo(null);
    setTitulo("");
    setDescripcion("");
    setProgreso(null);
    if (entrada.current) entrada.current.value = "";
  }

  async function subir(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setAviso(null);
    setProgreso(0);
    let ruta = "";
    try {
      ruta = await subirArchivo(archivo, setProgreso);
      const r = await guardarMaterialNuevo(ruta, archivo.name, { titulo, descripcion, tipo });
      if (!r.ok) throw new Error(r.error);
      setAviso({ ok: true, texto: `✅ «${titulo}» ya está en el curso.` });
      limpiar();
      router.refresh();
    } catch (err) {
      if (ruta) await descartarSubida(ruta).catch(() => {});
      setProgreso(null);
      setAviso({ ok: false, texto: err instanceof Error ? err.message : "No se pudo subir el archivo." });
    }
  }

  const subiendo = progreso !== null;

  return (
    <section className="tarjeta border-marca/40 p-5 sm:p-6" aria-labelledby="subir-nuevo">
      <h2 id="subir-nuevo" className="font-display text-lg font-semibold">⬆️ Subir un archivo nuevo al curso</h2>
      <p className="mt-1 text-sm text-suave">PDF, ZIP, videos, textos… hasta 1 GB. Aparece al instante para tus alumnos.</p>

      {!archivo ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            elegir(e.dataTransfer.files?.[0]);
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
            arrastrando ? "border-marca-2 bg-marca-2/10" : "border-borde hover:border-marca/60 hover:bg-white/[.03]"
          }`}
        >
          <span className="text-4xl" aria-hidden>📁</span>
          <span className="font-semibold">Toca para elegir un archivo</span>
          <span className="text-xs text-suave">o arrástralo aquí</span>
          <input ref={entrada} type="file" className="sr-only" onChange={(e) => elegir(e.target.files?.[0])} />
        </label>
      ) : (
        <form onSubmit={subir} className="mt-4 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-borde bg-white/[.03] px-3 py-2.5">
            <span className="text-2xl" aria-hidden>📄</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{archivo.name}</p>
              <p className="text-xs text-suave">{tamanoLegible(archivo.size)}</p>
            </div>
            {!subiendo && (
              <button type="button" onClick={limpiar} className="rounded-full px-3 py-1.5 text-sm text-suave hover:bg-white/5 hover:text-texto">
                Cambiar
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Título que verá el alumno</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required minLength={2} maxLength={120} className={campo} disabled={subiendo} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Sección</span>
              <SelectorSeccion
                valor={tipo}
                alCambiar={(t) => {
                  // Si la descripción era la automática, la cambia también
                  if (descripcion === DESCRIPCION_POR_TIPO[tipo]) setDescripcion(DESCRIPCION_POR_TIPO[t]);
                  setTipo(t);
                }}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Descripción corta (opcional)</span>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={300} className={campo} disabled={subiendo} />
          </label>

          {subiendo ? (
            <BarraProgreso valor={progreso} />
          ) : (
            <button className="btn-primario w-full sm:w-auto">⬆️ Subir al curso</button>
          )}
        </form>
      )}

      {aviso && (
        <p role="status" className={`mt-3 text-sm ${aviso.ok ? "text-emerald-300" : "text-red-300"}`}>
          {aviso.texto}
        </p>
      )}
    </section>
  );
}

/* ───────────── Cada archivo del curso ───────────── */

function FilaMaterial({ m, primero, ultimo }: { m: MaterialAdmin; primero: boolean; ultimo: boolean }) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const [pendiente, iniciar] = useTransition();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(m.titulo);
  const [descripcion, setDescripcion] = useState(m.descripcion);
  const [tipo, setTipo] = useState<TipoMaterial>(m.tipo);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const reemplazo = useRef<HTMLInputElement>(null);

  function ejecutar(fn: () => Promise<{ ok: boolean; error?: string }>, exito?: string) {
    setAviso(null);
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) return setAviso({ ok: false, texto: r.error ?? "Error" });
      if (exito) setAviso({ ok: true, texto: exito });
      router.refresh();
    });
  }

  async function reemplazar(f: File | undefined) {
    if (!f) return;
    if (reemplazo.current) reemplazo.current.value = "";
    if (f.size > MAX_BYTES_MATERIAL) return setAviso({ ok: false, texto: "Ese archivo pesa más de 1 GB." });
    if (
      !(await confirmar({
        titulo: "¿Reemplazar el archivo?",
        mensaje: (
          <>
            Tus alumnos descargarán <b>{f.name}</b> en lugar de <b>{m.archivo}</b>. El título y la sección se mantienen.
          </>
        ),
        boton: "Reemplazar",
      }))
    )
      return;
    setAviso(null);
    setProgreso(0);
    let ruta = "";
    try {
      ruta = await subirArchivo(f, setProgreso);
      const r = await reemplazarArchivo(m.id, ruta, f.name);
      if (!r.ok) throw new Error(r.error);
      setAviso({ ok: true, texto: "✅ Archivo reemplazado." });
      router.refresh();
    } catch (err) {
      if (ruta) await descartarSubida(ruta).catch(() => {});
      setAviso({ ok: false, texto: err instanceof Error ? err.message : "No se pudo reemplazar." });
    } finally {
      setProgreso(null);
    }
  }

  const ocupado = pendiente || progreso !== null;
  const btnIcono =
    "grid h-9 w-9 place-items-center rounded-full border border-borde text-sm text-suave transition hover:bg-white/5 hover:text-texto disabled:opacity-30";
  const btn = "rounded-full border border-borde px-3 py-1.5 text-sm transition hover:bg-white/5 disabled:opacity-50";

  return (
    <article className="tarjeta p-4">
      {!editando ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex shrink-0 gap-1 sm:flex-col">
            <button onClick={() => ejecutar(() => moverMaterial(m.id, "arriba"))} disabled={primero || ocupado} className={btnIcono} aria-label="Subir de posición" title="Subir">
              ▲
            </button>
            <button onClick={() => ejecutar(() => moverMaterial(m.id, "abajo"))} disabled={ultimo || ocupado} className={btnIcono} aria-label="Bajar de posición" title="Bajar">
              ▼
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold">{m.titulo}</h4>
            {m.descripcion && <p className="mt-0.5 text-sm text-suave">{m.descripcion}</p>}
            <p className="mt-1 truncate text-xs text-suave/80">
              {m.carpeta ? `${m.carpeta} / ` : ""}
              {m.archivo} · {tamanoLegible(m.bytes)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              onClick={() =>
                iniciar(async () => {
                  const r = await verMaterial(m.id);
                  if (r.ok) window.open(r.url, "_blank", "noopener");
                  else setAviso({ ok: false, texto: r.error });
                })
              }
              disabled={ocupado}
              className={btn}
            >
              👁 Ver
            </button>
            <button onClick={() => setEditando(true)} disabled={ocupado} className={btn}>
              ✏️ Editar
            </button>
            <label className={`${btn} cursor-pointer ${ocupado ? "pointer-events-none opacity-50" : ""}`}>
              🔁 Reemplazar
              <input ref={reemplazo} type="file" className="sr-only" onChange={(e) => reemplazar(e.target.files?.[0])} />
            </label>
            <button
              onClick={async () => {
                if (
                  await confirmar({
                    titulo: "¿Eliminar este archivo del curso?",
                    mensaje: (
                      <>
                        <b>{m.titulo}</b> desaparecerá para todos tus alumnos y se borrará de forma permanente. Esto no se puede deshacer.
                      </>
                    ),
                    boton: "Eliminar",
                    peligro: true,
                  })
                )
                  ejecutar(() => eliminarMaterial(m.id));
              }}
              disabled={ocupado}
              className={`${btn} border-red-400/40 text-red-300 hover:bg-red-400/10`}
            >
              🗑 Eliminar
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            ejecutar(async () => {
              const r = await editarMaterial(m.id, { titulo, descripcion, tipo });
              if (r.ok) setEditando(false);
              return r;
            }, "✅ Cambios guardados.");
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Título</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required minLength={2} maxLength={120} className={campo} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Sección</span>
              <SelectorSeccion valor={tipo} alCambiar={setTipo} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Descripción</span>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={300} className={campo} />
          </label>
          <p className="text-xs text-suave">Archivo: {m.archivo} · {tamanoLegible(m.bytes)}</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={pendiente} className="btn-primario px-5! py-2! text-sm disabled:opacity-60">
              {pendiente ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false);
                setTitulo(m.titulo);
                setDescripcion(m.descripcion);
                setTipo(m.tipo);
              }}
              className={btn}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {progreso !== null && <BarraProgreso valor={progreso} />}
      {aviso && (
        <p role="status" className={`mt-2 text-sm ${aviso.ok ? "text-emerald-300" : "text-red-300"}`}>
          {aviso.texto}
        </p>
      )}
    </article>
  );
}
