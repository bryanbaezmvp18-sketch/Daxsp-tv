"use client";

import { useConfirmar } from "./Confirmar";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { aprobarPedido, quitarAcceso, rechazarPedido, renovarEnlace, verComprobante } from "@/app/admin/acciones";
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
  estado: "pendiente" | "aprobado" | "rechazado";
  bancoOrigen: string;
  fechaTransferencia: string;
  referencia: string;
  motivoRechazo: string;
  fotos: number;
  bancoDestino: string;
  nota: string;
  paypalOrderId: string;
  creadoEn: string;
  revisadoEn: string;
  revisadoPor: string;
  alumnoConAcceso: boolean;
  enlace: string | null;
  /** Cuenta de Google del cliente (si compró con ella) */
  uid: string | null;
}

const ESTILO_ESTADO = {
  pendiente: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  aprobado: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  rechazado: "bg-red-400/15 text-red-300 border-red-400/30",
};

/** wa.me necesita el código de país; los números dominicanos de 10 dígitos llevan 1 delante. */
function numeroWhatsApp(n: string) {
  const d = n.replace(/\D/g, "");
  return d.length === 10 && /^(809|829|849)/.test(d) ? `1${d}` : d;
}

function enlaceWhatsApp(numero: string, texto: string) {
  return `https://wa.me/${numeroWhatsApp(numero)}?text=${encodeURIComponent(texto)}`;
}

export function TarjetaPedido({ p, recienAprobado = false }: { p: PedidoVista; recienAprobado?: boolean }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const confirmar = useConfirmar();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enlace, setEnlace] = useState(p.enlace);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [comprobante, setComprobante] = useState<string | null>(null);

  const primerNombre = p.nombre.split(" ")[0];
  const mensajeAcceso = (url: string) =>
    `¡Hola ${primerNombre}! 🎉 Confirmamos tu pago de ${curso.nombre}.\n\nEste es tu enlace personal para entrar al curso (guárdalo y no lo compartas):\n${url}`;

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
    });
  }

  function abrirComprobante(indice: number) {
    iniciar(async () => {
      const r = await verComprobante(p.id, indice);
      if (r.ok && r.url) setComprobante(r.url);
      else setAviso({ tipo: "error", texto: r.ok ? "Sin comprobante" : r.error });
    });
  }

  const monto = p.moneda === "USD" ? formatoUSD(p.monto) : formatoDOP(p.monto);

  return (
    <article
      id={`pedido-${p.id}`}
      className={`tarjeta scroll-mt-24 p-4 sm:p-5 ${recienAprobado ? "border-emerald-400/60 ring-2 ring-emerald-400/30" : ""}`}
    >
      {recienAprobado && (
        <p className="mb-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
          ✅ Pago aprobado y acceso liberado.{" "}
          {p.uid ? (
            <>El curso ya aparece en <b>«Mi cuenta»</b> del cliente. Si quieres, avísale por WhatsApp.</>
          ) : (
            <><b>Ahora envíale su enlace por WhatsApp</b> con el botón verde de abajo.</>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{p.nombre}</h2>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${ESTILO_ESTADO[p.estado]}`}>
              {p.estado}
            </span>
            <span className="rounded-full border border-borde px-2 py-0.5 text-xs text-suave capitalize">{p.metodo}</span>
          </div>
          <p className="mt-1 truncate text-sm text-suave">
            {p.email} · {p.whatsapp}
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-bold">{monto}</div>
          <div className="text-xs text-suave">{p.creadoEn}</div>
        </div>
      </div>

      {p.metodo === "transferencia" && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-white/[.03] p-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-suave">Pagó a</dt><dd>{p.bancoDestino || "—"}</dd></div>
          <div><dt className="text-xs text-suave">Desde</dt><dd>{p.bancoOrigen}</dd></div>
          <div><dt className="text-xs text-suave">Fecha</dt><dd>{p.fechaTransferencia}</dd></div>
          <div><dt className="text-xs text-suave">Referencia</dt><dd className="font-mono break-all">{p.referencia || "—"}</dd></div>
          {p.nota && <div className="col-span-full"><dt className="text-xs text-suave">Nota del cliente</dt><dd>{p.nota}</dd></div>}
        </dl>
      )}
      {p.metodo === "paypal" && (
        <p className="mt-4 rounded-xl bg-white/[.03] p-3 text-sm">
          💳 Pagado con tarjeta/PayPal · Orden <span className="font-mono">{p.paypalOrderId}</span> · acceso automático
        </p>
      )}

      {p.estado === "rechazado" && p.motivoRechazo && (
        <p className="mt-3 text-sm text-red-300">Motivo: {p.motivoRechazo}</p>
      )}
      {p.revisadoPor && (
        <p className="mt-2 text-xs text-suave">Revisado por {p.revisadoPor} · {p.revisadoEn}</p>
      )}

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: p.fotos }, (_, i) => (
          <button key={i} onClick={() => abrirComprobante(i)} disabled={pendiente} className="btn-secundario px-4! py-2! text-sm">
            🧾 {p.fotos > 1 ? `Foto ${i + 1}` : "Ver comprobante"}
          </button>
        ))}
        {p.estado !== "aprobado" && !enlace && (
          <>
            <button
              onClick={async () => {
                if (await confirmar({ titulo: "¿Aprobar este pago?", mensaje: `Confirmas que recibiste ${monto} de ${p.nombre}. Se le dará acceso al curso.`, boton: "Sí, aprobar" }))
                  ejecutar(async () => {
                    const r = await aprobarPedido(p.id);
                    // Lleva a "Aprobados" con este pedido resaltado para enviarle el enlace
                    if (r.ok) router.push(`/admin?estado=aprobado&nuevo=${p.id}${r.correoEnviado ? "&correo=1" : ""}#pedido-${p.id}`);
                    return r;
                  }, "Pago aprobado y acceso liberado.");
              }}
              disabled={pendiente}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
            >
              ✓ Aprobar y dar acceso
            </button>
            {p.estado === "pendiente" && (
              <button onClick={() => setRechazando((r) => !r)} disabled={pendiente} className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10">
                ✕ Rechazar
              </button>
            )}
          </>
        )}
      </div>

      {rechazando && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            ejecutar(async () => {
              const r = await rechazarPedido(p.id, motivo);
              if (r.ok) setRechazando(false);
              return r;
            }, "Pedido rechazado.");
          }}
        >
          <label className="block text-sm">
            Motivo del rechazo (lo verá el cliente)
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              minLength={5}
              maxLength={300}
              rows={2}
              placeholder="Ej. El monto no coincide / No encontramos la transferencia con esa referencia"
              className="mt-1 w-full rounded-xl border border-borde bg-fondo px-3 py-2 outline-none focus:border-red-400"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button disabled={pendiente} className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Confirmar rechazo</button>
            {p.whatsapp && motivo.length >= 5 && (
              <a
                href={enlaceWhatsApp(p.whatsapp, `Hola ${primerNombre}, revisamos tu comprobante de ${curso.nombre} y no pudimos confirmarlo: ${motivo}\n\nPuedes enviarlo de nuevo aquí: ${location.origin}/checkout`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-borde px-4 py-2 text-sm"
              >
                Avisar por WhatsApp
              </a>
            )}
          </div>
        </form>
      )}

      {/* Cliente con cuenta de Google: el curso está en «Mi cuenta», sin enlaces */}
      {p.uid && p.estado === "aprobado" && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
          <p className="text-sm font-semibold text-emerald-300">🎓 Curso desbloqueado en su cuenta</p>
          <p className="mt-1 text-xs text-suave">Lo ve al entrar con su Google en «Mi cuenta». No hace falta enviarle ningún enlace.</p>
          {p.whatsapp && (
            <a
              href={enlaceWhatsApp(
                p.whatsapp,
                `¡Hola ${primerNombre}! 🎉 Confirmamos tu pago de ${curso.nombre}.

Ya tienes el curso desbloqueado: entra con tu cuenta de Google en ${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/mi-cuenta`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-black"
            >
              Avisarle por WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Enlace de acceso del alumno (solo pedidos antiguos sin cuenta de Google) */}
      {enlace && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
          <p className="text-sm font-semibold text-emerald-300">Enlace de acceso del alumno</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-2 py-1.5 text-xs">{enlace}</code>
            <BotonCopiar valor={enlace} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={enlaceWhatsApp(p.whatsapp, mensajeAcceso(enlace))}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-black"
            >
              Enviar por WhatsApp
            </a>
            <button
              onClick={async () => {
                if (await confirmar({ titulo: "¿Renovar el enlace?", mensaje: "Se creará un enlace nuevo y el anterior dejará de funcionar.", boton: "Renovar" }))
                  ejecutar(() => renovarEnlace(p.alumnoId), "Enlace renovado.");
              }}
              disabled={pendiente}
              className="rounded-full border border-borde px-4 py-2 text-sm text-suave hover:text-texto"
            >
              Renovar enlace
            </button>
            <button
              onClick={async () => {
                if (await confirmar({ titulo: "¿Quitar el acceso?", mensaje: `${p.nombre} ya no podrá entrar al curso.`, boton: "Quitar acceso", peligro: true }))
                  ejecutar(async () => {
                    const r = await quitarAcceso(p.alumnoId);
                    if (r.ok) setEnlace(null);
                    return r;
                  }, "Acceso retirado.");
              }}
              disabled={pendiente}
              className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10"
            >
              Quitar acceso
            </button>
          </div>
        </div>
      )}

      {aviso && (
        <p role="status" className={`mt-3 text-sm ${aviso.tipo === "ok" ? "text-emerald-300" : "text-red-300"}`}>
          {aviso.texto}
        </p>
      )}

      {/* Visor del comprobante */}
      {comprobante && createPortal(
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4" onClick={() => setComprobante(null)} role="dialog" aria-label="Comprobante">
          <div className="relative flex max-h-full w-full max-w-3xl flex-col" onClick={(e) => e.stopPropagation()}>
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
