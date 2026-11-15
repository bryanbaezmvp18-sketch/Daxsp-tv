"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requerirAdmin } from "@/lib/sesion";

type Resultado = { ok: true } | { ok: false; error: string };

export interface DatosCuenta {
  banco: string;
  tipo: string;
  numero: string;
  titular: string;
  documento: string;
}

const limpiar = (v: string, max: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function validar(d: DatosCuenta): { datos: DatosCuenta } | { error: string } {
  const datos = {
    banco: limpiar(d.banco, 60),
    tipo: limpiar(d.tipo, 40),
    numero: limpiar(d.numero, 30),
    titular: limpiar(d.titular, 80),
    documento: limpiar(d.documento, 20),
  };
  if (datos.banco.length < 2) return { error: "Escribe el nombre del banco." };
  if (!datos.tipo) return { error: "Elige el tipo de cuenta." };
  if (!/^[\d-]{5,30}$/.test(datos.numero)) return { error: "El número de cuenta solo puede tener dígitos y guiones." };
  if (datos.titular.length < 3) return { error: "Escribe el nombre completo del titular." };
  if (datos.documento && !/^[\d-]{9,15}$/.test(datos.documento)) {
    return { error: "La cédula o RNC solo puede tener dígitos y guiones (o déjala vacía)." };
  }
  return { datos };
}

function refrescar() {
  revalidatePath("/admin/cuentas");
  revalidatePath("/checkout");
}

/** Crea una cuenta nueva o actualiza una existente (si llega id). */
export async function guardarCuenta(id: string | null, entrada: DatosCuenta): Promise<Resultado> {
  const admin = await requerirAdmin();
  const v = validar(entrada);
  if ("error" in v) return { ok: false, error: v.error };
  const col = adminDb().collection("cuentasBancarias");

  if (id) {
    const ref = col.doc(id);
    if (!(await ref.get()).exists) return { ok: false, error: "Esa cuenta ya no existe." };
    await ref.update({ ...v.datos, actualizadaPor: admin.email, actualizadaEn: FieldValue.serverTimestamp() });
  } else {
    const ultima = await col.orderBy("orden", "desc").limit(1).get();
    const orden = ((ultima.docs[0]?.get("orden") as number) ?? 0) + 1;
    await col.add({ ...v.datos, activa: true, orden, creadaPor: admin.email, creadaEn: FieldValue.serverTimestamp() });
  }
  refrescar();
  return { ok: true };
}

/** Muestra u oculta la cuenta en el checkout sin borrarla. */
export async function alternarCuenta(id: string, activa: boolean): Promise<Resultado> {
  await requerirAdmin();
  const ref = adminDb().collection("cuentasBancarias").doc(id);
  if (!(await ref.get()).exists) return { ok: false, error: "Esa cuenta ya no existe." };
  await ref.update({ activa });
  refrescar();
  return { ok: true };
}

export async function eliminarCuenta(id: string): Promise<Resultado> {
  await requerirAdmin();
  await adminDb().collection("cuentasBancarias").doc(id).delete();
  refrescar();
  return { ok: true };
}

/** Sube o baja una cuenta en el orden en que se muestra. */
export async function moverCuenta(id: string, direccion: -1 | 1): Promise<Resultado> {
  await requerirAdmin();
  const col = adminDb().collection("cuentasBancarias");
  const docs = (await col.orderBy("orden").get()).docs;
  const i = docs.findIndex((d) => d.id === id);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= docs.length) return { ok: true };
  const batch = adminDb().batch();
  batch.update(docs[i].ref, { orden: docs[j].get("orden") });
  batch.update(docs[j].ref, { orden: docs[i].get("orden") });
  await batch.commit();
  refrescar();
  return { ok: true };
}
