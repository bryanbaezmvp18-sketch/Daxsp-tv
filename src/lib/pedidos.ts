import "server-only";
import { FieldValue, Timestamp, type Firestore, type Transaction, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { enlaceAcceso, generarToken, urlSitio } from "@/lib/acceso";
import { correos, enviarCorreo } from "@/lib/correo";
import { nombreCompleto, type DatosCliente } from "@/lib/cliente";

/** Entrada del historial de un pedido: { estado, fecha, nota }. */
export const historial = (estado: string, nota: string) =>
  FieldValue.arrayUnion({ estado, fecha: Timestamp.now(), nota: nota.slice(0, 300) });

/** Busca el alumno por correo dentro de una transacción; si no existe lo prepara. */
export async function alumnoParaPedido(db: Firestore, tx: Transaction, datos: DatosCliente) {
  const existentes = await tx.get(db.collection("alumnos").where("email", "==", datos.email).limit(1));
  const ref: DocumentReference = existentes.docs[0]?.ref ?? db.collection("alumnos").doc();
  return { ref, existe: !existentes.empty, data: existentes.docs[0]?.data() };
}

export function datosAlumno(datos: DatosCliente) {
  return {
    nombre: nombreCompleto(datos),
    nombreSolo: datos.nombre,
    apellido: datos.apellido,
    email: datos.email,
    whatsapp: datos.telefono,
  };
}

/**
 * Aprueba un pedido y da acceso al alumno (idempotente: si ya estaba
 * aprobado no hace nada más). Envía el correo de bienvenida.
 */
export async function concederAcceso(pedidoId: string, revisadoPor: string) {
  const db = adminDb();
  const pedidoRef = db.collection("pedidos").doc(pedidoId);

  const r = await db.runTransaction(async (tx) => {
    const pedido = await tx.get(pedidoRef);
    if (!pedido.exists) throw new Error("El pedido no existe.");
    const alumnoRef = db.collection("alumnos").doc(pedido.get("alumnoId"));
    const alumno = await tx.get(alumnoRef);
    if (!alumno.exists) throw new Error("No se encontró el alumno.");

    const uid = pedido.get("uid") as string | undefined;
    const usuarioRef = uid ? db.collection("usuarios").doc(uid) : null;
    const usuario = usuarioRef ? await tx.get(usuarioRef) : null;

    const yaAprobado =
      pedido.get("estado") === "aprobado" && alumno.get("tieneAcceso") === true && (!usuario || usuario.get("estadoCompra") === "aprobado");
    const token = (alumno.get("tokenAcceso") as string | null) || generarToken();
    if (!yaAprobado) {
      tx.update(pedidoRef, {
        estado: "aprobado",
        motivoRechazo: null,
        revisadoEn: FieldValue.serverTimestamp(),
        revisadoPor,
        historial: historial("aprobado", `Aprobado por ${revisadoPor}`),
      });
      tx.update(alumnoRef, { tieneAcceso: true, tokenAcceso: token, accesoDesde: FieldValue.serverTimestamp() });
      if (usuarioRef && usuario?.exists) {
        tx.update(usuarioRef, {
          estadoCompra: "aprobado",
          pedidoActual: pedidoId,
          fechaAprobacion: FieldValue.serverTimestamp(),
          motivoRechazo: null,
        });
      }
    }
    return { token, yaAprobado, conCuenta: Boolean(usuario?.exists), nombre: alumno.get("nombre") as string, email: alumno.get("email") as string };
  });

  // Con cuenta de Google el curso está en «Mi cuenta»; el enlace personal queda solo para pedidos antiguos
  const enlace = r.conCuenta ? `${urlSitio()}/mi-cuenta` : enlaceAcceso(r.token);
  let correoEnviado: boolean | undefined;
  if (!r.yaAprobado) {
    const c = correos.bienvenida(r.nombre, enlace);
    correoEnviado = (await enviarCorreo(r.email, c.asunto, c.html)).enviado;
  }
  return { enlace, token: r.token, yaAprobado: r.yaAprobado, correoEnviado };
}
