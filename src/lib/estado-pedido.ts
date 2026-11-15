import "server-only";
import type { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export interface EstadoPedido {
  estado: "pendiente" | "aprobado" | "rechazado" | "retirado";
  nombre: string;
  monto: number;
  moneda: string;
  bancoDestino: string;
  enviado: string;
  motivoRechazo: string;
  enlaceCurso: string | null;
}

const valido = (c: string) => /^[A-Za-z0-9_-]{20,40}$/.test(c);

/** Busca el pedido por su código secreto de seguimiento. */
export async function estadoPorCodigo(codigo: string): Promise<EstadoPedido | null> {
  if (!valido(codigo)) return null;
  const db = adminDb();
  const snap = await db.collection("pedidos").where("codigoSeguimiento", "==", codigo).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return null;
  const p = doc.data();

  let enlaceCurso: string | null = null;
  if (p.estado === "aprobado") {
    const alumno = await db.collection("alumnos").doc(p.alumnoId).get();
    const token = alumno.get("tieneAcceso") === true ? (alumno.get("tokenAcceso") as string | null) : null;
    if (token) enlaceCurso = `/acceso/${token}`;
  }

  const creado = (p.creadoEn as Timestamp | undefined)?.toDate();
  return {
    estado: p.estado,
    nombre: String(p.nombre ?? "").split(" ")[0],
    monto: p.monto,
    moneda: p.moneda,
    bancoDestino: p.bancoDestino ?? "",
    enviado: creado
      ? creado.toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" })
      : "",
    motivoRechazo: p.motivoRechazo ?? "",
    enlaceCurso,
  };
}
