"use client";

import { useConfirmar } from "./Confirmar";

import { useState, useTransition } from "react";
import { alternarCuenta, eliminarCuenta, guardarCuenta, moverCuenta, type DatosCuenta } from "@/app/admin/cuentas/acciones";
import { BANCOS_RD, TIPOS_CUENTA } from "@/lib/bancos";

interface Cuenta extends DatosCuenta {
  id: string;
  activa: boolean;
}

const VACIA: DatosCuenta = { banco: "", tipo: TIPOS_CUENTA[0], numero: "", titular: "", documento: "" };

export function GestionCuentas({ cuentas }: { cuentas: Cuenta[] }) {
  const [pendiente, iniciar] = useTransition();
  const confirmar = useConfirmar();
  const [editando, setEditando] = useState<string | "nueva" | null>(cuentas.length ? null : "nueva");
  const [error, setError] = useState("");

  function ejecutar(fn: () => Promise<{ ok: boolean; error?: string }>, alTerminar?: () => void) {
    setError("");
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) return setError(r.error ?? "Algo salió mal.");
      alTerminar?.();
    });
  }

  const activas = cuentas.filter((c) => c.activa).length;

  return (
    <div className="mt-6 space-y-3">
      {cuentas.length > 0 && activas === 0 && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          ⚠️ No tienes ninguna cuenta activa: tus clientes no podrán pagar por transferencia.
        </p>
      )}

      {cuentas.map((c, i) =>
        editando === c.id ? (
          <FormularioCuenta
            key={c.id}
            inicial={c}
            pendiente={pendiente}
            onCancelar={() => setEditando(null)}
            onGuardar={(d) => ejecutar(() => guardarCuenta(c.id, d), () => setEditando(null))}
          />
        ) : (
          <article key={c.id} className={`tarjeta p-4 ${c.activa ? "" : "opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{c.banco}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.activa ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-suave"
                    }`}
                  >
                    {c.activa ? "Visible" : "Oculta"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-suave">
                  {c.tipo} · <span className="font-mono text-texto">{c.numero}</span>
                </p>
                <p className="text-sm text-suave">
                  {c.titular}
                  {c.documento && ` · ${c.documento}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1" aria-label="Orden">
                <button onClick={() => ejecutar(() => moverCuenta(c.id, -1))} disabled={pendiente || i === 0} className="rounded-lg border border-borde px-2 text-suave disabled:opacity-30" aria-label="Subir">
                  ↑
                </button>
                <button onClick={() => ejecutar(() => moverCuenta(c.id, 1))} disabled={pendiente || i === cuentas.length - 1} className="rounded-lg border border-borde px-2 text-suave disabled:opacity-30" aria-label="Bajar">
                  ↓
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <button onClick={() => setEditando(c.id)} disabled={pendiente} className="rounded-full border border-borde px-3 py-1.5 hover:bg-white/5">
                ✏️ Editar
              </button>
              <button onClick={() => ejecutar(() => alternarCuenta(c.id, !c.activa))} disabled={pendiente} className="rounded-full border border-borde px-3 py-1.5 hover:bg-white/5">
                {c.activa ? "🙈 Ocultar" : "👁️ Mostrar"}
              </button>
              <button
                onClick={async () => (await confirmar({ titulo: "¿Eliminar esta cuenta?", mensaje: `${c.banco} terminada en ${c.numero.slice(-4)}. Si solo quieres que no se vea, usa «Ocultar».`, boton: "Eliminar", peligro: true })) && ejecutar(() => eliminarCuenta(c.id))}
                disabled={pendiente}
                className="rounded-full border border-red-400/30 px-3 py-1.5 text-red-300 hover:bg-red-400/10"
              >
                Eliminar
              </button>
            </div>
          </article>
        ),
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {editando === "nueva" ? (
        <FormularioCuenta
          inicial={VACIA}
          pendiente={pendiente}
          onCancelar={cuentas.length ? () => setEditando(null) : undefined}
          onGuardar={(d) => ejecutar(() => guardarCuenta(null, d), () => setEditando(null))}
        />
      ) : (
        <button onClick={() => setEditando("nueva")} className="btn-secundario text-sm">
          + Añadir cuenta
        </button>
      )}
    </div>
  );
}

function FormularioCuenta(p: {
  inicial: DatosCuenta;
  pendiente: boolean;
  onGuardar: (d: DatosCuenta) => void;
  onCancelar?: () => void;
}) {
  const [d, setD] = useState<DatosCuenta>(p.inicial);
  const campo = (k: keyof DatosCuenta) => ({
    value: d[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD((x) => ({ ...x, [k]: e.target.value })),
  });
  const estilo =
    "w-full rounded-xl border border-borde bg-fondo px-4 py-3 outline-none [color-scheme:dark] focus:border-marca focus:ring-2 focus:ring-marca/30";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        p.onGuardar(d);
      }}
      className="tarjeta space-y-4 border-marca/40 p-5"
    >
      <h2 className="font-display text-lg font-semibold">{p.inicial.numero ? "Editar cuenta" : "Nueva cuenta"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Banco</span>
          <input {...campo("banco")} list="lista-bancos" required placeholder="Ej. Banco Popular" className={estilo} />
          <datalist id="lista-bancos">
            {BANCOS_RD.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Tipo de cuenta</span>
          <select {...campo("tipo")} className={estilo}>
            {TIPOS_CUENTA.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Número de cuenta</span>
          <input {...campo("numero")} required inputMode="numeric" pattern="[0-9\-]{5,30}" className={`${estilo} font-mono`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Cédula o RNC del titular <span className="font-normal text-suave">(opcional)</span></span>
          <input {...campo("documento")} inputMode="numeric" placeholder="000-0000000-0" pattern="[0-9\-]{9,15}" className={`${estilo} font-mono`} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium">Nombre completo del titular</span>
          <input {...campo("titular")} required minLength={3} className={estilo} />
        </label>
      </div>
      <div className="flex gap-2">
        <button disabled={p.pendiente} className="btn-primario px-5! py-2.5! text-sm disabled:opacity-60">
          {p.pendiente ? "Guardando…" : "Guardar cuenta"}
        </button>
        {p.onCancelar && (
          <button type="button" onClick={p.onCancelar} className="rounded-full border border-borde px-4 py-2 text-sm text-suave">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
