"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useConfirmar } from "./Confirmar";
import { aprobarPedido, devolverAcceso, quitarAcceso, rechazarPedido, renovarEnlace, verComprobante } from "@/app/admin/acciones";
import { BotonCopiar } from "@/components/checkout/BotonCopiar";
import { curso, formatoDOP, formatoUSD } from "@/config/curso";

export interface PedidoVista {
  id: string;
  alumnoId: string;
  nombre: string;
  email: string;
  whatsapp: string;
  metodo: string;
  monto: number;
  moneda: string;
  estado: "pendiente" | "aprobado" | "rechazado" | "retirado";
  bancoOrigen: string;
  fechaTransferencia: string;
  referencia: string;
  motivoRechazo: string;
  motivoRetiro: string;
  fotos: number;
  bancoDestino: string;
  nota: string;
  paypalOrderId: string;
  creadoEn: string;
  /** Milisegundos de creación, para «hace X» */
  creadoMs: number;
  revisadoEn: string;
  revisadoPor: string;
  retiradoEn: string;
  retiradoPor: string;
  alumnoConAcceso: boolean;
  enlace: string | null;
  /** Cuenta de Google del cliente (si compró con ella) */
  uid: string | null;
}

const ESTADOS = {
  pendiente: { texto: "Pendiente", pill: "bg-amber-400/15 text-amber-300 border-amber-400/30", borde: "border-l-amber-400", avatar: "bg-amber-400/15 text-amber-300" },
  aprobado: { texto: "Aprobado", pill: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30", borde: "border-l-emerald-400", avatar: "bg-emerald-400/15 text-emerald-300" },
  rechazado: { texto: "Rechazado", pill: "bg-red-400/15 text-red-300 border-red-400/30", borde: "border-l-red-400", avatar: "bg-red-400/15 text-red-300" },
  retirado: { texto: "Acceso retirado", pill: "bg-zinc-400/15 text-zinc-300 border-zinc-400/30", borde: "border-l-zinc-500", avatar: "bg-zinc-400/15 text-zinc-300" },
};

/** wa.me necesita el código de país; los números dominicanos de 10 dígitos llevan 1 delante. */
function numeroWhatsApp(n: string) {
  const d = n.replace(/\D/g, "");
  return d.length === 10 && /^(809|829|849)/.test(d) ? `1${d}` : d;
}

function enlaceWhatsApp(numero: string, texto: string) {
  return `https://wa.me/${numeroWhatsApp(numero)}?text=${encodeURIComponent(texto)}`;
}

/** «hace 5 min», «hace 3 h», «hace 2 días» */
function haceCuanto(ms: number) {
  if (!ms) return "";
  const min = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

function Dato({ t, v, mono = false }: { t: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-wider text-suave uppercase">{t}</dt>
      <dd className={`mt-0.5 truncate font-medium ${mono ? "font-mono text-sm" : ""}`}>{v || "—"}</dd>
    </div>
  );
}

export function TarjetaPedido({ p, recienAprobado = false }: { p: PedidoVista; recienAprobado?: boolean }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const confirmar = useConfirmar();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enlace, setEnlace] = useState(p.enlace);
  const [formulario, setFormulario] = useState<null | "rechazar" | "quitar">(null);
  const [motivo, setMotivo] = useState("");
  const [comprobante, setComprobante] = useState<string | null>(null);
  // Cerrado por defecto (solo nombre y correo); abierto si se acaba de aprobar
  const [abierto, setAbierto] = useState(recienAprobado);

  const e = ESTADOS[p.estado] ?? ESTADOS.pendiente;
  const primerNombre = p.nombre.split(" ")[0];
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const monto = p.moneda === "USD" ? formatoUSD(p.monto) : formatoDOP(p.monto);
  const espera = p.estado === "pendiente" ? haceCuanto(p.creadoMs) : "";
  const esperaLarga = p.estado === "pendiente" && p.creadoMs > 0 && Date.now() - p.creadoMs > 24 * 3600_000;

  function ejecutar(fn: () => Promise<{ ok: boolean; error?: string; enlace?: string; correoEnviado?: boolean }>, exito: string) {
    setAviso(null);
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) return setAviso({ tipo: "error", texto: r.error ?? "Error" });
      if (r.enlace) setEnlace(r.enlace);
      setAviso({
        tipo: "ok",
        texto: exito + (r.correoEnviado === false ? " (el correo no se envió: Resend aún no está configurado; usa WhatsApp)" : ""),
      });
      router.refresh();
    });
  }

  function abrirComprobante(indice: number) {
    iniciar(async () => {
      const r = await verComprobante(p.id, indice);
      if (r.ok && r.url) setComprobante(r.url);
      else setAviso({ tipo: "error", texto: r.ok ? "Sin comprobante" : r.error });
    });
  }

  async function aprobar() {
    if (!(await confirmar({ titulo: "¿Aprobar este pago?", mensaje: `Confirmas que recibiste ${monto} de ${p.nombre}. Se le dará acceso al curso.`, boton: "Sí, aprobar" }))) return;
    ejecutar(async () => {
      const r = await aprobarPedido(p.id);
      if (r.ok) router.push(`/admin?estado=aprobado&nuevo=${p.id}${r.correoEnviado ? "&correo=1" : ""}#pedido-${p.id}`);
      return r;
    }, "Pago aprobado y acceso liberado.");
  }

  async function devolver() {
    if (!(await confirmar({ titulo: "¿Devolver el acceso?", mensaje: `${p.nombre} podrá volver a ver el curso en «Mi cuenta».`, boton: "Devolver acceso" }))) return;
    ejecutar(() => devolverAcceso(p.id), "Acceso devuelto.");
  }

  function abrirFormulario(f: "rechazar" | "quitar") {
    setMotivo("");
    setAviso(null);
    setFormulario((actual) => (actual === f ? null : f));
  }

  const btnBase = "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60";

  return (
    <article
      id={`pedido-${p.id}`}
      className={`tarjeta scroll-mt-24 overflow-hidden border-l-4 ${e.borde} ${recienAprobado ? "ring-2 ring-emerald-400/40" : ""}`}
    >
      {recienAprobado && (
        <p className="border-b border-emerald-400/20 bg-emerald-400/10 px-5 py-2.5 text-sm text-emerald-300">
          ✅ Pago aprobado y acceso liberado.{" "}
          {p.uid ? <>El curso ya aparece en <b>«Mi cuenta»</b> del cliente.</> : <><b>Envíale su enlace por WhatsApp</b> con el botón verde.</>}
        </p>
      )}

      {/* ── Fila compacta: nombre + correo (clic para ver todo) ── */}
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls={`detalle-${p.id}`}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[.03]"
      >
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${e.avatar}`} aria-hidden>
          {p.nombre.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-semibold sm:text-lg">{p.nombre}</span>
          <span className="block truncate text-sm text-suave">{p.email}</span>
        </span>
        {espera && (
          <span
            suppressHydrationWarning
            className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${esperaLarga ? "bg-red-400/15 text-red-300" : "bg-amber-400/15 text-amber-300"}`}
          >
            ⏳ {espera.replace("hace ", "")}
          </span>
        )}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 shrink-0 text-suave transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </button>

      {abierto && (
      <div id={`detalle-${p.id}`} className="border-t border-borde/60">
      {/* ── Resumen: estado, método, contacto y monto ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${e.pill}`}>{e.texto}</span>
            <span className="rounded-full border border-borde px-2.5 py-0.5 text-xs text-suave">
              {p.metodo === "paypal" ? "💳 Tarjeta / PayPal" : "🏦 Transferencia"}
            </span>
            {espera && (
              <span suppressHydrationWarning className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${esperaLarga ? "bg-red-400/15 text-red-300" : "bg-amber-400/15 text-amber-300"}`}>
                ⏳ Esperando {espera.replace("hace ", "")}
              </span>
            )}
          </div>
          {p.whatsapp && (
            <a href={enlaceWhatsApp(p.whatsapp, `Hola ${primerNombre}`)} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-suave hover:text-texto">
              📱 {p.whatsapp}
            </a>
          )}
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold">{monto}</div>
          <div className="text-xs text-suave">{p.creadoEn}</div>
        </div>
      </div>

      {/* ── Datos del pago + comprobante ── */}
      <div className="grid gap-3 px-5 sm:grid-cols-[1fr_auto]">
        {p.metodo === "paypal" ? (
          <div className="rounded-xl bg-white/[.03] p-4 text-sm">
            <Dato t="Orden PayPal" v={p.paypalOrderId} mono />
            <p className="mt-2 text-xs text-suave">Pago automático con tarjeta/PayPal.</p>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-white/[.03] p-4 sm:grid-cols-4">
            <Dato t="Pagó a" v={p.bancoDestino} />
            <Dato t="Desde" v={p.bancoOrigen} />
            <Dato t="Fecha" v={p.fechaTransferencia} />
            <Dato t="Referencia" v={p.referencia} mono />
            {p.nota && (
              <div className="col-span-full">
                <dt className="text-[11px] tracking-wider text-suave uppercase">Nota del cliente</dt>
                <dd className="mt-0.5 text-sm">{p.nota}</dd>
              </div>
            )}
          </dl>
        )}

        {p.fotos > 0 && (
          <div className="flex flex-row gap-2 sm:flex-col">
            {Array.from({ length: p.fotos }, (_, i) => (
              <button
                key={i}
                onClick={() => abrirComprobante(i)}
                disabled={pendiente}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-borde bg-white/[.03] px-4 py-3 text-sm font-semibold transition hover:border-marca-2/50 hover:bg-white/[.06]"
              >
                🧾 {p.fotos > 1 ? `Comprobante ${i + 1}` : "Ver comprobante"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Estado y acciones ── */}
      <div className="p-5 pt-4">
        {p.estado === "pendiente" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/5 p-3">
            <p className="mr-auto text-sm text-amber-200">Revisa el comprobante y confirma si el dinero llegó.</p>
            <button onClick={aprobar} disabled={pendiente} className={`${btnBase} bg-emerald-500 text-black hover:bg-emerald-400`}>
              ✓ Aprobar y dar acceso
            </button>
            <button onClick={() => abrirFormulario("rechazar")} disabled={pendiente} className={`${btnBase} border border-red-400/40 text-red-300 hover:bg-red-400/10`}>
              ✕ Rechazar
            </button>
          </div>
        )}

        {p.estado === "rechazado" && (
          <div className="rounded-xl border border-red-400/25 bg-red-400/5 p-3 text-sm">
            <p className="font-semibold text-red-300">Pago rechazado</p>
            {p.motivoRechazo && <p className="mt-1 text-suave">Motivo: {p.motivoRechazo}</p>}
          </div>
        )}

        {p.estado === "aprobado" && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-3">
            <div className="mr-auto min-w-0">
              <p className="text-sm font-semibold text-emerald-300">🎓 {p.uid ? "Curso desbloqueado en su cuenta" : "Tiene acceso con enlace personal"}</p>
              <p className="text-xs text-suave">
                {p.uid ? "Lo ve al entrar con su Google en «Mi cuenta»." : "Pedido antiguo: entra con el enlace de abajo."}
              </p>
            </div>
            {p.uid && p.whatsapp && (
              <a
                href={enlaceWhatsApp(p.whatsapp, `¡Hola ${primerNombre}! 🎉 Confirmamos tu pago de ${curso.nombre}.\n\nYa tienes el curso desbloqueado: entra con tu cuenta de Google en ${sitio}/mi-cuenta`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} bg-[#25D366] text-black hover:brightness-110`}
              >
                Avisarle por WhatsApp
              </a>
            )}
            <button onClick={() => abrirFormulario("quitar")} disabled={pendiente} className={`${btnBase} border border-red-400/40 text-red-300 hover:bg-red-400/10`}>
              🔒 Quitar acceso
            </button>
          </div>
        )}

        {p.estado === "retirado" && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-400/25 bg-zinc-400/5 p-3">
            <div className="mr-auto min-w-0 text-sm">
              <p className="font-semibold text-zinc-200">🔒 Ya no tiene acceso al curso</p>
              {p.motivoRetiro && <p className="mt-0.5 text-suave">Motivo: {p.motivoRetiro}</p>}
            </div>
            <button onClick={devolver} disabled={pendiente} className={`${btnBase} bg-emerald-500 text-black hover:bg-emerald-400`}>
              ↺ Devolver acceso
            </button>
          </div>
        )}

        {/* Formulario: rechazar o quitar acceso */}
        {formulario && (
          <form
            className="mt-3 space-y-3 rounded-xl border border-red-400/25 bg-red-400/5 p-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (formulario === "rechazar") {
                ejecutar(async () => {
                  const r = await rechazarPedido(p.id, motivo);
                  if (r.ok) setFormulario(null);
                  return r;
                }, "Pedido rechazado.");
              } else {
                ejecutar(async () => {
                  const r = await quitarAcceso(p.id, motivo);
                  if (r.ok) {
                    setFormulario(null);
                    setEnlace(null);
                  }
                  return r;
                }, "Acceso retirado.");
              }
            }}
          >
            <p className="text-sm font-semibold text-red-200">
              {formulario === "rechazar" ? "Rechazar este pago" : `Quitar el acceso a ${primerNombre}`}
            </p>
            {formulario === "quitar" && (
              <p className="text-xs text-suave">Dejará de ver el curso al instante. Podrás devolvérselo cuando quieras.</p>
            )}
            <label className="block text-sm">
              {formulario === "rechazar" ? "Motivo (lo verá el cliente)" : "Motivo (opcional, lo verá el cliente)"}
              <textarea
                value={motivo}
                onChange={(ev) => setMotivo(ev.target.value)}
                required={formulario === "rechazar"}
                minLength={formulario === "rechazar" ? 5 : undefined}
                maxLength={300}
                rows={2}
                placeholder={formulario === "rechazar" ? "Ej. El monto no coincide / No encontramos la transferencia" : "Ej. Se le devolvió el dinero"}
                className="mt-1 w-full rounded-xl border border-borde bg-fondo px-3 py-2 outline-none focus:border-red-400"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button disabled={pendiente} className={`${btnBase} bg-red-500 text-white hover:bg-red-400`}>
                {formulario === "rechazar" ? "Confirmar rechazo" : "Sí, quitar acceso"}
              </button>
              <button type="button" onClick={() => setFormulario(null)} className={`${btnBase} border border-borde text-suave hover:text-texto`}>
                Cancelar
              </button>
              {formulario === "rechazar" && p.whatsapp && motivo.length >= 5 && (
                <a
                  href={enlaceWhatsApp(p.whatsapp, `Hola ${primerNombre}, revisamos tu comprobante de ${curso.nombre} y no pudimos confirmarlo: ${motivo}\n\nPuedes enviarlo de nuevo aquí: ${sitio}/checkout`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnBase} border border-borde`}
                >
                  Avisar por WhatsApp
                </a>
              )}
            </div>
          </form>
        )}

        {/* Enlace de acceso (solo pedidos antiguos sin cuenta de Google) */}
        {enlace && p.estado === "aprobado" && (
          <div className="mt-3 rounded-xl border border-borde bg-white/[.03] p-3">
            <p className="text-xs tracking-wider text-suave uppercase">Enlace de acceso del alumno</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-2 py-1.5 text-xs">{enlace}</code>
              <BotonCopiar valor={enlace} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={enlaceWhatsApp(p.whatsapp, `¡Hola ${primerNombre}! 🎉 Confirmamos tu pago de ${curso.nombre}.\n\nEste es tu enlace personal para entrar al curso (guárdalo y no lo compartas):\n${enlace}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} bg-[#25D366] text-black`}
              >
                Enviar por WhatsApp
              </a>
              <button
                onClick={async () => {
                  if (await confirmar({ titulo: "¿Renovar el enlace?", mensaje: "Se creará un enlace nuevo y el anterior dejará de funcionar.", boton: "Renovar" }))
                    ejecutar(() => renovarEnlace(p.alumnoId), "Enlace renovado.");
                }}
                disabled={pendiente}
                className={`${btnBase} border border-borde text-suave hover:text-texto`}
              >
                Renovar enlace
              </button>
            </div>
          </div>
        )}

        {aviso && (
          <p role="status" className={`mt-3 text-sm ${aviso.tipo === "ok" ? "text-emerald-300" : "text-red-300"}`}>
            {aviso.texto}
          </p>
        )}

        {/* Quién lo revisó */}
        {(p.revisadoPor || p.retiradoPor) && (
          <p className="mt-3 border-t border-borde/60 pt-3 text-xs text-suave">
            {p.revisadoPor && <>Revisado por {p.revisadoPor} · {p.revisadoEn}</>}
            {p.retiradoPor && p.estado === "retirado" && <> · Acceso retirado por {p.retiradoPor} · {p.retiradoEn}</>}
          </p>
        )}
      </div>
      </div>
      )}

      {/* Visor del comprobante */}
      {comprobante && createPortal(
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4" onClick={() => setComprobante(null)} role="dialog" aria-label="Comprobante">
          <div className="relative flex max-h-full w-full max-w-3xl flex-col" onClick={(ev) => ev.stopPropagation()}>
            <div className="mb-2 flex justify-between gap-2">
              <a href={comprobante} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2 text-sm">Abrir en pestaña nueva</a>
              <button onClick={() => setComprobante(null)} className="rounded-full bg-white/10 px-4 py-2 text-sm">Cerrar ✕</button>
            </div>
            <object data={comprobante} className="h-[80dvh] w-full rounded-xl bg-white" aria-label="Comprobante">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={comprobante} alt="Comprobante de pago" className="max-h-[80dvh] w-full rounded-xl object-contain" />
            </object>
          </div>
        </div>,
        document.body,
      )}
    </article>
  );
}
