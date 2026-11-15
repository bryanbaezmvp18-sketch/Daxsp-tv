"use client";

import { useState, useTransition } from "react";
import { guardarPrecios } from "@/app/admin/precios/acciones";
import { descuento, ofertaVigente, type Precios } from "@/lib/precios-tipos";
import { formatoDOP, formatoUSD } from "@/config/curso";
import { Cronometro } from "@/components/Cronometro";
import { useConfirmar } from "./Confirmar";

/** ISO → valor para <input type="datetime-local"> en la hora local del navegador. */
function aLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const enHoras = (h: number) => aLocal(new Date(Date.now() + h * 3600 * 1000).toISOString());

export function EditorPrecios({ inicial }: { inicial: Precios }) {
  const confirmar = useConfirmar();
  const [usd, setUsd] = useState(String(inicial.usd));
  const [usdAntes, setUsdAntes] = useState(inicial.usdAntes ? String(inicial.usdAntes) : "");
  const [dop, setDop] = useState(String(inicial.dop));
  const [ofertaActiva, setOfertaActiva] = useState(inicial.oferta.activa);
  const [texto, setTexto] = useState(inicial.oferta.texto);
  const [fin, setFin] = useState(aLocal(inicial.oferta.terminaEn) || enHoras(72));
  const [guardado, setGuardado] = useState(inicial);
  const [pendiente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const finIso = fin ? new Date(fin).toISOString() : null;
  const vista: Precios = {
    usd: Number(usd) || 0,
    usdAntes: Number(usdAntes) || null,
    dop: Number(dop) || 0,
    oferta: { activa: ofertaActiva, texto: texto.trim(), terminaEn: ofertaActiva ? finIso : guardado.oferta.terminaEn },
  };
  const pct = descuento(vista);
  // Compara al minuto (el selector de fecha no tiene segundos)
  const normalizar = (p: Precios) => JSON.stringify({ ...p, oferta: { ...p.oferta, terminaEn: aLocal(p.oferta.terminaEn) } });
  const cambio = normalizar(vista) !== normalizar(guardado);
  const vencida = guardado.oferta.activa && !ofertaVigente(guardado.oferta);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await confirmar({
      titulo: "¿Publicar estos cambios?",
      mensaje: (
        <ul className="mt-1 space-y-1">
          <li>Tarjeta/PayPal: <b className="text-texto">{formatoUSD(vista.usd)}</b></li>
          <li>Transferencia: <b className="text-texto">{formatoDOP(vista.dop)}</b></li>
          <li>
            Oferta:{" "}
            <b className="text-texto">
              {vista.oferta.activa && finIso ? `hasta el ${new Date(finIso).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" })}` : "sin cronómetro"}
            </b>
          </li>
        </ul>
      ),
      boton: "Publicar",
    });
    if (!ok) return;
    setAviso(null);
    iniciar(async () => {
      const r = await guardarPrecios(vista);
      if (r.ok) {
        setGuardado(vista);
        setAviso({ tipo: "ok", texto: "✅ Cambios publicados. Ya se ven en la página principal." });
      } else setAviso({ tipo: "error", texto: r.error });
    });
  }

  const estilo =
    "w-full rounded-xl border border-borde bg-fondo py-3 pr-4 pl-14 font-display text-lg outline-none focus:border-marca focus:ring-2 focus:ring-marca/30";

  return (
    <form onSubmit={guardar} className="mt-6 space-y-5">
      {/* Precios */}
      <div className="tarjeta space-y-5 p-5">
        <h2 className="font-display text-lg font-semibold">💲 Precios</h2>
        <Campo etiqueta="Precio con tarjeta o PayPal" ayuda="Es lo que se cobra automáticamente." prefijo="US$">
          <input value={usd} onChange={(e) => setUsd(e.target.value)} type="number" min={1} step="0.01" required inputMode="decimal" className={estilo} />
        </Campo>
        <Campo etiqueta="Precio por transferencia" ayuda="El monto que verá el cliente para transferir." prefijo="RD$">
          <input value={dop} onChange={(e) => setDop(e.target.value)} type="number" min={50} step="1" required inputMode="numeric" className={estilo} />
        </Campo>
        <Campo etiqueta="Precio tachado (opcional)" ayuda="Se muestra tachado como precio anterior. Déjalo vacío si no hay oferta." prefijo="US$">
          <input value={usdAntes} onChange={(e) => setUsdAntes(e.target.value)} type="number" min={0} step="0.01" inputMode="decimal" placeholder="Sin oferta" className={estilo} />
        </Campo>
      </div>

      {/* Oferta con cronómetro */}
      <div className="tarjeta space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">⏱️ Oferta con cronómetro</h2>
            <p className="text-xs text-suave">Muestra una cuenta regresiva en la página principal hasta la fecha que elijas.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ofertaActiva}
            aria-label="Activar cronómetro de oferta"
            onClick={() => setOfertaActiva((a) => !a)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${ofertaActiva ? "bg-marca" : "bg-white/15"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${ofertaActiva ? "left-6" : "left-1"}`} />
          </button>
        </div>

        {vencida && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            ⚠️ La oferta anterior ya terminó y el cronómetro no se muestra. Elige una nueva fecha y publica.
          </p>
        )}

        {ofertaActiva && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Texto de la oferta</span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={80}
                placeholder="Precio de lanzamiento por tiempo limitado"
                className="w-full rounded-xl border border-borde bg-fondo px-4 py-3 outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">La oferta termina el</span>
              <input
                type="datetime-local"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                required
                className="w-full rounded-xl border border-borde bg-fondo px-4 py-3 outline-none [color-scheme:dark] focus:border-marca focus:ring-2 focus:ring-marca/30"
              />
            </label>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="py-1.5 text-suave">Rápido:</span>
              {[
                { t: "24 horas", h: 24 },
                { t: "3 días", h: 72 },
                { t: "7 días", h: 168 },
                { t: "15 días", h: 360 },
              ].map((r) => (
                <button key={r.t} type="button" onClick={() => setFin(enHoras(r.h))} className="rounded-full border border-borde px-3 py-1.5 hover:bg-white/5">
                  +{r.t}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Vista previa */}
      <div className="rounded-2xl border border-dashed border-borde p-5">
        <p className="text-xs tracking-wider text-suave uppercase">Así lo verán tus clientes</p>
        {vista.oferta.activa && finIso && (
          <div className="mt-3 rounded-xl bg-linear-to-r from-marca/80 via-acento/70 to-marca/80 px-3 py-2 text-center text-sm font-semibold text-white">
            🔥 {vista.oferta.texto || "Oferta"} · termina en <Cronometro fin={finIso} variante="linea" />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <span className="font-display text-4xl font-bold">{formatoUSD(vista.usd)}</span>
          {vista.usdAntes && vista.usdAntes > vista.usd && <s className="pb-1 text-lg text-suave">{formatoUSD(vista.usdAntes)}</s>}
          {pct > 0 && <span className="mb-1.5 rounded-full bg-acento/15 px-2.5 py-0.5 text-xs font-bold text-acento">-{pct}%</span>}
        </div>
        <p className="mt-1 text-sm text-suave">o {formatoDOP(vista.dop)} por transferencia</p>
        {vista.oferta.activa && finIso && (
          <div className="mt-4">
            <Cronometro fin={finIso} />
          </div>
        )}
      </div>

      {aviso && <p role="status" className={`text-sm ${aviso.tipo === "ok" ? "text-emerald-300" : "text-red-300"}`}>{aviso.texto}</p>}

      <button disabled={pendiente || !cambio} className="btn-primario w-full text-base disabled:opacity-50">
        {pendiente ? "Publicando…" : cambio ? "Guardar y publicar" : "Sin cambios"}
      </button>
    </form>
  );
}

function Campo({ etiqueta, ayuda, prefijo, children }: { etiqueta: string; ayuda: string; prefijo: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{etiqueta}</span>
      <span className="mb-1.5 block text-xs text-suave">{ayuda}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-suave">{prefijo}</span>
        {children}
      </span>
    </label>
  );
}
