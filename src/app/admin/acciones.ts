"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requerirAdmin } from "@/lib/sesion";
import { enlaceAcceso, generarToken, urlSitio } from "@/lib/acceso";
import { concederAcceso, historial } from "@/lib/pedidos";
import { urlTemporal } from "@/lib/archivos";
import { correos, enviarCorreo } from "@/lib/correo";

type Resultado = { ok: true; enlace?: string; correoEnviado?: boolean; url?: string } | { ok: false; error: string };

const idValido = (id: string) => /^[a-zA-Z0-9-]{10,40}$/.test(id); // UUID (transferencia) u orderId (PayPal)

/** Aprueba el pago, da acceso al alumno y le envía su enlace. */
export async function aprobarPedido(pedidoId: string): Promise<Resultado> {
  const admin = await requerirAdmin();
  if (!idValido(pedidoId)) return { ok: false, error: "Pedido inválido" };
  try {
    const r = await concederAcceso(pedidoId, admin.email);
    revalidatePath("/admin");
    return { ok: true, enlace: r.enlace, correoEnviado: r.correoEnviado };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo aprobar." };
  }
}

/** Rechaza el pago con un motivo y avisa al alumno. */
export async function rechazarPedido(pedidoId: string, motivo: string): Promise<Resultado> {
  const admin = await requerirAdmin();
  motivo = motivo.trim().slice(0, 300);
  if (!idValido(pedidoId)) return { ok: false, error: "Pedido inválido" };
  if (motivo.length < 5) return { ok: false, error: "Escribe un motivo (mínimo 5 caracteres)." };

  const ref = adminDb().collection("pedidos").doc(pedidoId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "El pedido no existe." };
  if (snap.get("estado") === "aprobado") return { ok: false, error: "No se puede rechazar un pedido ya aprobado." };

  await ref.update({
    estado: "rechazado",
    motivoRechazo: motivo,
    revisadoEn: FieldValue.serverTimestamp(),
    revisadoPor: admin.email,
    historial: historial("rechazado", motivo),
  });
  // La cuenta de Google del cliente refleja el rechazo (podrá subir otro comprobante)
  const uid = snap.get("uid") as string | undefined;
  if (uid) {
    await adminDb().collection("usuarios").doc(uid).set(
      { estadoCompra: "rechazado", motivoRechazo: motivo, pedidoActual: pedidoId },
      { merge: true },
    );
  }
  const c = correos.rechazo(snap.get("nombre"), motivo, `${urlSitio()}/checkout`);
  const { enviado } = await enviarCorreo(snap.get("email"), c.asunto, c.html);
  revalidatePath("/admin");
  return { ok: true, correoEnviado: enviado };
}

/** URL temporal (15 min) para ver una foto del comprobante. */
export async function verComprobante(pedidoId: string, indice = 0): Promise<Resultado> {
  await requerirAdmin();
  if (!idValido(pedidoId)) return { ok: false, error: "Pedido inválido" };
  const snap = await adminDb().collection("pedidos").doc(pedidoId).get();
  const rutas = (snap.get("comprobantes") as string[] | undefined) ?? [snap.get("comprobanteRuta")].filter(Boolean);
  const ruta = rutas[indice];
  if (!ruta) return { ok: false, error: "Este pedido no tiene esa foto." };
  return { ok: true, url: await urlTemporal(ruta) };
}

/** Crea un enlace nuevo (el anterior deja de funcionar). */
export async function renovarEnlace(alumnoId: string): Promise<Resultado> {
  await requerirAdmin();
  const ref = adminDb().collection("alumnos").doc(alumnoId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("tieneAcceso") !== true) return { ok: false, error: "El alumno no tiene acceso." };
  const token = generarToken();
  await ref.update({ tokenAcceso: token });
  revalidatePath("/admin");
  return { ok: true, enlace: enlaceAcceso(token) };
}

/** Quita el acceso (p. ej. si se devolvió el dinero). */
export async function quitarAcceso(alumnoId: string): Promise<Resultado> {
  await requerirAdmin();
  const ref = adminDb().collection("alumnos").doc(alumnoId);
  if (!(await ref.get()).exists) return { ok: false, error: "No se encontró el alumno." };
  await ref.update({ tieneAcceso: false, tokenAcceso: null });
  revalidatePath("/admin");
  return { ok: true };
}
