"use client";

import { useState } from "react";
import { formatoDOP, formatoUSD } from "@/config/curso";
import type { Precios } from "@/lib/precios-tipos";
import type { DatosCliente } from "@/lib/cliente";
import type { CuentaPublica } from "@/lib/bancos";
import { FormularioTransferencia } from "./FormularioTransferencia";
import { BotonesPayPal } from "./BotonesPayPal";
import { Campo } from "./campos";

type Metodo = "transferencia" | "paypal";

/** Paso 1: datos del cliente · Paso 2: método de pago (transferencia o tarjeta/PayPal). */
export function Checkout({
  paypalActivo,
  cuentas,
  p,
  cuenta,
}: {
  paypalActivo: boolean;
  cuentas: CuentaPublica[];
  p: Precios;
  /** Cuenta de Google con la que inició sesión */
  cuenta: { nombre: string; email: string; fotoURL: string | null; telefono: string };
}) {
  const [metodo, setMetodo] = useState<Metodo>("transferencia");
  const [nombre, ...resto] = cuenta.nombre.trim().split(/\s+/);
  const [datos, setDatos] = useState<DatosCliente>({
    nombre: nombre ?? "",
    apellido: resto.join(" "),
    email: cuenta.email,
    telefono: cuenta.telefono,
  });

  const cambiar = (k: keyof DatosCliente) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="space-y-8">
      {/* 1. Datos */}
      <section className="tarjeta p-5 sm:p-6" aria-labelledby="paso-datos">
        <h2 id="paso-datos" className="font-display text-lg font-semibold">
          <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-marca/20 text-sm text-marca-2">1</span>
          Tus datos
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo id="campo-nombre" label="Nombre" value={datos.nombre} onChange={cambiar("nombre")} autoComplete="given-name" required minLength={2} maxLength={50} />
          <Campo id="campo-apellido" label="Apellido" value={datos.apellido} onChange={cambiar("apellido")} autoComplete="family-name" required minLength={2} maxLength={50} />
          <Campo
            id="campo-telefono"
            label="Teléfono / WhatsApp"
            value={datos.telefono}
            onChange={cambiar("telefono")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="809 000 0000"
            required
          />
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-borde bg-white/[.03] px-3 py-2.5">
          {cuenta.fotoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cuenta.fotoURL} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-marca/20 text-sm font-bold text-marca-2">{cuenta.nombre.charAt(0)}</span>
          )}
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{cuenta.email}</p>
            <p className="text-xs text-suave">Tu compra queda guardada en esta cuenta de Google</p>
          </div>
        </div>
      </section>

      {/* 2. Método de pago */}
      <section aria-labelledby="paso-pago">
        <h2 id="paso-pago" className="font-display text-lg font-semibold">
          <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-marca/20 text-sm text-marca-2">2</span>
          Elige cómo pagar
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Método de pago">
          <OpcionMetodo
            activo={metodo === "transferencia"}
            onClick={() => setMetodo("transferencia")}
            icono="🏦"
            titulo="Transferencia"
            detalle={formatoDOP(p.dop)}
          />
          <OpcionMetodo
            activo={metodo === "paypal"}
            onClick={() => setMetodo("paypal")}
            icono="💳"
            titulo="Tarjeta o PayPal"
            detalle={`${formatoUSD(p.usd)} · pago seguro`}
          />
        </div>

        <div className="tarjeta mt-4 p-5 sm:p-6">
          {metodo === "transferencia" ? (
            <FormularioTransferencia datos={datos} cuentas={cuentas} p={p} />
          ) : (
            <BotonesPayPal datos={datos} activo={paypalActivo} p={p} />
          )}
        </div>
      </section>
    </div>
  );
}

function OpcionMetodo(p: { activo: boolean; onClick: () => void; icono: string; titulo: string; detalle: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={p.activo}
      onClick={p.onClick}
      className={`rounded-2xl p-4 text-left transition ${
        p.activo ? "border-2 border-marca bg-marca/10" : "border border-borde hover:border-marca/50"
      }`}
    >
      <div className="text-2xl" aria-hidden>{p.icono}</div>
      <div className="mt-1 font-semibold">{p.titulo}</div>
      <div className="text-xs text-suave">{p.detalle}</div>
    </button>
  );
}
