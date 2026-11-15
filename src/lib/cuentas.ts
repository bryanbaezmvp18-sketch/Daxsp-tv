import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { CuentaPublica } from "@/lib/bancos";

/** Cuenta bancaria para recibir transferencias (colección "cuentasBancarias"). */
export interface CuentaBancaria extends CuentaPublica {
  activa: boolean;
  orden: number;
}

export async function obtenerCuentas({ soloActivas = false } = {}): Promise<CuentaBancaria[]> {
  const snap = await adminDb().collection("cuentasBancarias").orderBy("orden").get();
  const cuentas = snap.docs.map((d) => {
    const c = d.data();
    return {
      id: d.id,
      banco: c.banco,
      tipo: c.tipo,
      numero: c.numero,
      titular: c.titular,
      documento: c.documento,
      activa: c.activa === true,
      orden: c.orden ?? 0,
    };
  });
  return soloActivas ? cuentas.filter((c) => c.activa) : cuentas;
}

/** Solo lo que el cliente necesita ver. */
export const aPublica = ({ id, banco, tipo, numero, titular, documento }: CuentaBancaria): CuentaPublica => ({
  id,
  banco,
  tipo,
  numero,
  titular,
  documento,
});
