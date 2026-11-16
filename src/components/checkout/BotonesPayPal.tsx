"use client";

import { useEffect, useRef, useState } from "react";
import { formatoUSD } from "@/config/curso";
import type { Precios } from "@/lib/precios-tipos";
import type { DatosCliente } from "@/lib/cliente";
import { campoFaltante, faltanDatos, irACampo } from "./campos";

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

declare global {
  interface Window {
    paypal?: {
      Buttons: (opciones: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void>; close: () => void; isEligible: () => boolean };
      FUNDING: Record<string, string>;
    };
  }
}

let cargaSdk: Promise<void> | null = null;
function cargarSdk() {
  if (window.paypal) return Promise.resolve();
  cargaSdk ??= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD&intent=capture&components=buttons&enable-funding=card&disable-funding=paylater,venmo`; // sin «locale»: PayPal usa el idioma del navegador (es_XC ya no lo acepta → error 400)
    s.onload = () => ok();
    s.onerror = () => {
      cargaSdk = null;
      mal(new Error("No se pudo cargar PayPal"));
    };
    document.head.appendChild(s);
  });
  return cargaSdk;
}

export function BotonesPayPal({ datos, activo, p }: { datos: DatosCliente; activo: boolean; p: Precios }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const datosRef = useRef(datos);
  datosRef.current = datos; // los botones leen siempre los datos actuales
  const [estado, setEstado] = useState<"cargando" | "listo" | "procesando" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!activo || !CLIENT_ID) return;
    let botones: { close: () => void } | null = null;
    let cancelado = false;

    cargarSdk()
      .then(() => {
        if (cancelado || !contenedor.current || !window.paypal) return;
        const b = window.paypal.Buttons({
          style: { layout: "vertical", shape: "pill", label: "pay", height: 48 },
          onClick: (_: unknown, actions: { reject: () => void; resolve: () => void }) => {
            const falta = faltanDatos(datosRef.current);
            if (falta) {
              setMensaje(falta);
              // Lleva al campo que falta y lo marca (antes solo subía y el aviso quedaba abajo, sin verse)
              irACampo(campoFaltante(datosRef.current) ?? "nombre");
              return actions.reject();
            }
            setMensaje("");
            return actions.resolve();
          },
          createOrder: async () => {
            const res = await fetch("/api/paypal/crear-orden", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(datosRef.current),
            });
            const r = await res.json();
            if (!res.ok) throw new Error(r.error);
            return r.id;
          },
          onApprove: async ({ orderID }: { orderID: string }) => {
            setEstado("procesando");
            const res = await fetch("/api/paypal/capturar-orden", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: orderID }),
            });
            const r = await res.json().catch(() => ({}));
            if (!res.ok) {
              setEstado("listo");
              return setMensaje(r.error ?? "No pudimos confirmar el pago.");
            }
            window.location.href = r.acceso; // guarda el acceso y entra al curso
          },
          onCancel: () => setMensaje("Cancelaste el pago. Puedes intentarlo de nuevo cuando quieras."),
          onError: (e: Error) => {
            console.error(e);
            setMensaje(e?.message && !e.message.includes("Window") ? e.message : "Hubo un problema con el pago. Inténtalo de nuevo.");
          },
        });
        botones = b;
        return b.render(contenedor.current).then(() => !cancelado && setEstado("listo"));
      })
      .catch(() => !cancelado && setEstado("error"));

    return () => {
      cancelado = true;
      botones?.close();
    };
  }, [activo]);

  if (!activo || !CLIENT_ID) {
    return (
      <div className="py-6 text-center">
        <div className="text-4xl" aria-hidden>💳</div>
        <p className="mt-3 font-semibold">El pago con tarjeta estará disponible muy pronto</p>
        <p className="mt-1 text-sm text-suave">Mientras tanto puedes pagar por transferencia bancaria.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Paga con tarjeta de crédito/débito o PayPal</p>
          <p className="text-xs text-suave">No necesitas cuenta de PayPal. Confirmamos tu pago y te damos acceso al curso.</p>
        </div>
        <span className="shrink-0 font-display text-xl font-bold">{formatoUSD(p.usd)}</span>
      </div>

      {estado === "cargando" && <p className="py-6 text-center text-sm text-suave">Cargando opciones de pago…</p>}
      {estado === "error" && (
        <p className="py-6 text-center text-sm text-red-300">No se pudo cargar PayPal. Revisa tu conexión y recarga la página.</p>
      )}
      {estado === "procesando" && (
        <p className="py-4 text-center text-sm text-marca-2">Confirmando tu pago… no cierres esta página.</p>
      )}

      {/* Aviso ENCIMA de los botones para que se vea al volver */}
      {mensaje && (
        <p role="alert" className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          ⚠️ {mensaje}
        </p>
      )}

      {/* PayPal pinta aquí sus botones (fondo blanco para que se vean bien) */}
      <div ref={contenedor} className={`rounded-2xl bg-white p-3 ${estado === "listo" || estado === "procesando" ? "" : "hidden"}`} />
      <p className="mt-4 text-center text-xs text-suave">🔒 Pago procesado por PayPal. Nunca vemos ni guardamos los datos de tu tarjeta.</p>
    </div>
  );
}
