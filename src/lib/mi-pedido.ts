import "server-only";
import type { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export interface MiPedido {
  id: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  metodo: "transferencia" | "paypal";
  monto: number;
  moneda: string;
  referencia: string;
  bancoDestino: string;
  fotos: number;
  motivoRechazo: string;
  enviado: string | null;
  aprobado: string | null;
}

const fecha = (t?: Timestamp | null) =>
  t ? t.toDate().toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" }) : null;

/** Pedido actual del cliente (solo si le pertenece). */
export async function miPedido(uid: string): Promise<MiPedido | null> {
  const db = adminDb();
  const pedidoId = (await db.collection("usuarios").doc(uid).get()).get("pedidoActual") as string | undefined;
  if (!pedidoId) return null;
  const d = await db.collection("pedidos").doc(pedidoId).get();
  if (!d.exists || d.get("uid") !== uid) return null;
  const p = d.data()!;
  return {
    id: d.id,
    estado: p.estado,
    metodo: p.metodo,
    monto: p.monto,
    moneda: p.moneda,
    referencia: p.referencia ?? "",
    bancoDestino: p.bancoDestino ?? "",
    fotos: (p.comprobantes as string[] | undefined)?.length ?? 0,
    motivoRechazo: p.motivoRechazo ?? "",
    enviado: fecha(p.creadoEn),
    aprobado: p.estado === "aprobado" ? fecha(p.revisadoEn) : null,
  };
}
