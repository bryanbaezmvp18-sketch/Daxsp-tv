import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { nombreCompleto, type DatosCliente } from "@/lib/cliente";
import { alumnoParaPedido, datosAlumno } from "@/lib/pedidos";
import type { CapturaPayPal } from "@/lib/paypal";

/**
 * Registra un pago de PayPal ya CAPTURADO y verificado. Idempotente por
 * orderId: el pedido se guarda en pedidos/{orderId}, así que si llegan a la vez
 * la captura del navegador y el webhook, solo se crea una vez.
 */
export async function registrarPagoPayPal(orderId: string, captura: CapturaPayPal, origen: "captura" | "webhook") {
  if (captura.estado !== "COMPLETED") throw new Error(`Pago no completado (${captura.estado})`);
  const db = adminDb();
  const ordenRef = db.collection("ordenesPaypal").doc(orderId);
  const pedidoRef = db.collection("pedidos").doc(orderId);

  // El monto cobrado debe ser EXACTAMENTE el que fijó el servidor al crear la orden
  const montoEsperado = (await ordenRef.get()).get("monto");
  if (captura.moneda !== "USD" || captura.monto !== montoEsperado) {
    throw new Error(`Monto inesperado: ${captura.monto} ${captura.moneda} (esperado ${montoEsperado} USD)`);
  }

  await db.runTransaction(async (tx) => {
    const [orden, pedido] = await Promise.all([tx.get(ordenRef), tx.get(pedidoRef)]);
    if (pedido.exists) return; // ya registrado
    if (!orden.exists) throw new Error("Orden de PayPal desconocida");
    const cliente = orden.get("cliente") as DatosCliente;
    const uid = orden.get("uid") as string | undefined;
    // Lecturas antes de escribir (regla de las transacciones)
    const usuarioRef = uid ? db.collection("usuarios").doc(uid) : null;
    const usuario = usuarioRef ? await tx.get(usuarioRef) : null;

    const alumno = await alumnoParaPedido(db, tx, cliente);
    if (alumno.existe) tx.update(alumno.ref, datosAlumno(cliente));
    else tx.set(alumno.ref, { ...datosAlumno(cliente), tieneAcceso: false, tokenAcceso: null, fechaRegistro: FieldValue.serverTimestamp() });

    tx.create(pedidoRef, {
      ...(uid && { uid }),
      alumnoId: alumno.ref.id,
      nombre: nombreCompleto(cliente),
      email: cliente.email,
      whatsapp: cliente.telefono,
      metodo: "paypal",
      monto: Number(captura.monto),
      moneda: "USD",
      estado: "pendiente", // el admin lo aprueba desde el panel (concederAcceso)
      paypalOrderId: orderId,
      paypalCaptureId: captura.captureId,
      registradoPor: origen,
      historial: [{ estado: "pendiente", fecha: Timestamp.now(), nota: `Pago cobrado por PayPal/tarjeta (${origen}). Esperando aprobación.` }],
      motivoRechazo: null,
      creadoEn: FieldValue.serverTimestamp(),
      revisadoEn: null,
      revisadoPor: null,
    });
    tx.update(ordenRef, { estado: "capturada", capturadaEn: FieldValue.serverTimestamp() });
    // El cliente ve «En revisión» en «Mi cuenta» hasta que el admin lo apruebe
    if (usuarioRef && usuario?.exists) {
      tx.update(usuarioRef, { estadoCompra: "pendiente", pedidoActual: orderId, motivoRechazo: null });
    }
  });
  // Ya NO se da acceso automático: el curso se desbloquea solo cuando el admin aprueba el pedido.
}
