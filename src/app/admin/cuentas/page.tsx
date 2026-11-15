import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/sesion";
import { obtenerCuentas } from "@/lib/cuentas";
import { CabeceraAdmin } from "@/components/admin/CabeceraAdmin";
import { GestionCuentas } from "@/components/admin/GestionCuentas";

export const metadata: Metadata = { title: "Cuentas bancarias · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const yo = await requerirAdmin();
  const cuentas = await obtenerCuentas();

  return (
    <>
      <CabeceraAdmin email={yo.email} expira={yo.expira} activa="cuentas" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Cuentas bancarias</h1>
        <p className="mt-2 text-sm text-suave">
          Las cuentas <b className="text-texto">activas</b> son las que ven tus clientes al pagar por transferencia.
        </p>
        <GestionCuentas cuentas={cuentas} />
      </main>
    </>
  );
}
