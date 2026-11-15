import Link from "next/link";
import type { Metadata } from "next";
import { CabeceraSimple } from "@/components/CabeceraSimple";
import { Checkout } from "@/components/checkout/Checkout";
import { curso, precio, formatoUSD, formatoDOP } from "@/config/curso";
import { paypalConfigurado } from "@/lib/paypal";
import { obtenerPrecios } from "@/lib/precios";
import { aPublica, obtenerCuentas } from "@/lib/cuentas";
import { redirect } from "next/navigation";
import { requerirCliente } from "@/lib/cliente-sesion";

export const metadata: Metadata = { title: "Checkout · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Sin cuenta de Google no se puede pagar
  const cliente = await requerirCliente("/checkout");
  if (cliente.estadoCompra === "pendiente" || cliente.estadoCompra === "aprobado" || cliente.estadoCompra === "retirado") redirect("/mi-cuenta");
  const [cuentas, p] = await Promise.all([obtenerCuentas({ soloActivas: true }).then((c) => c.map(aPublica)), obtenerPrecios()]);
  return (
    <>
      <CabeceraSimple>
        <Link href="/mi-cuenta" className="text-suave hover:text-texto">Mi cuenta</Link>
      </CabeceraSimple>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Finaliza tu compra</h1>
          <p className="mt-2 mb-6 text-suave">
            {cliente.estadoCompra === "rechazado"
              ? "Tu comprobante anterior no pudo validarse. Envía uno nuevo aquí."
              : "Al confirmar tu pago, el curso se desbloquea en «Mi cuenta»."}
          </p>
          <Checkout paypalActivo={paypalConfigurado()} cuentas={cuentas} p={p} cuenta={{ nombre: cliente.nombre, email: cliente.email, fotoURL: cliente.fotoURL, telefono: cliente.telefono }} />
        </div>

        <aside className="order-1 lg:order-2">
          <div className="tarjeta p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold tracking-wider text-suave uppercase">Tu pedido</h2>
            <div className="mt-3 flex items-start justify-between gap-4">
              <span className="font-semibold">{curso.nombre}</span>
              <span className="shrink-0 text-right">
                <b className="font-display text-xl">{formatoUSD(p.usd)}</b>
                <span className="block text-xs text-suave">o {formatoDOP(p.dop)} por transferencia</span>
              </span>
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-borde pt-4 text-sm text-suave">
              <li>✓ Acceso de por vida</li>
              <li>✓ Videos y PDFs descargables</li>
              {precio.garantiaDias > 0 && <li>✓ Garantía de {precio.garantiaDias} días</li>}
              <li>🔒 Pago seguro</li>
            </ul>
          </div>
        </aside>
      </main>
    </>
  );
}
