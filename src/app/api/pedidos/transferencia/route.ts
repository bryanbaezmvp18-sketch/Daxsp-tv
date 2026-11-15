import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { clienteActual } from "@/lib/cliente-sesion";
import { adminAuth, adminBucket, adminDb } from "@/lib/firebase/admin";
import { correos, enviarCorreo } from "@/lib/correo";
import { urlSitio } from "@/lib/acceso";
import { validarCliente, nombreCompleto } from "@/lib/cliente";
import { alumnoParaPedido, datosAlumno } from "@/lib/pedidos";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";

const MAX_FOTOS = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;
const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

class ErrorUsuario extends Error {}

/**
 * Registra un pago por transferencia. El navegador ya subió las fotos del
 * comprobante a Storage (comprobantes/{uid}/{pedidoId}/...) con SU cuenta de
 * Google; aquí verificamos la sesión, cada archivo, y creamos el pedido.
 * Sin sesión de Google no se puede pagar.
 */
export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  if (texto(b.sitio, 100)) return NextResponse.json({ ok: true }); // trampa para bots

  const sesion = await clienteActual();
  if (!sesion) return NextResponse.json({ error: "Entra con tu cuenta de Google para pagar." }, { status: 401 });
  if (sesion.estadoCompra === "pendiente" || sesion.estadoCompra === "aprobado") {
    return NextResponse.json({ error: "Ya tienes un pago registrado. Revisa su estado en «Mi cuenta»." }, { status: 409 });
  }

  // El correo siempre es el de su cuenta de Google
  const v = validarCliente({ ...b, email: sesion.email });
  const errores = "errores" in v ? [...v.errores] : [];
  const cuentaId = texto(b.cuentaId, 40);
  const bancoOrigen = texto(b.bancoOrigen, 60);
  const referencia = texto(b.referencia, 60);
  const nota = texto(b.nota, 300);
  const fechaTransferencia = texto(b.fecha, 10);
  const monto = Number(b.monto);
  const pedidoId = texto(b.pedidoId, 40);
  const rutas = Array.isArray(b.rutas) ? b.rutas.map((r) => texto(r, 200)).filter(Boolean) : [];

  if (!cuentaId) errores.push("Elige la cuenta a la que transferiste.");
  if (!bancoOrigen) errores.push("Indica el banco desde el que transferiste.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTransferencia)) errores.push("La fecha no es válida.");
  if (!Number.isFinite(monto) || monto <= 0 || monto > 1_000_000) errores.push("El monto no es válido.");
  if (!/^[a-zA-Z0-9-]{10,40}$/.test(pedidoId)) errores.push("Pedido inválido.");
  if (rutas.length < 1 || rutas.length > MAX_FOTOS) errores.push(`Adjunta entre 1 y ${MAX_FOTOS} fotos del comprobante.`);
  if (errores.length || !("datos" in v)) return NextResponse.json({ error: errores.join(" ") }, { status: 400 });
  const cliente = v.datos;

  try {
    const token = await adminAuth().verifyIdToken(texto(b.idToken, 4000));
    if (token.uid !== sesion.uid) return NextResponse.json({ error: "Tu sesión cambió. Recarga la página." }, { status: 401 });
    const prefijo = `comprobantes/${token.uid}/${pedidoId}/`;

    const cuenta = await adminDb().collection("cuentasBancarias").doc(cuentaId).get();
    if (!cuenta.exists || cuenta.get("activa") !== true) {
      return NextResponse.json({ error: "Esa cuenta ya no está disponible. Recarga la página y elige otra." }, { status: 400 });
    }
    const bancoDestino = `${cuenta.get("banco")} · ${String(cuenta.get("numero")).slice(-4)}`;
    // Código secreto para que el cliente consulte el estado de su pago
    const codigo = randomBytes(18).toString("base64url");

    for (const ruta of rutas) {
      if (!ruta.startsWith(prefijo)) return NextResponse.json({ error: "Comprobante inválido." }, { status: 400 });
      const archivo = adminBucket().file(ruta);
      const [existe] = await archivo.exists();
      if (!existe) return NextResponse.json({ error: "No encontramos una de las fotos. Vuelve a subirlas." }, { status: 400 });
      const [meta] = await archivo.getMetadata();
      if (Number(meta.size) > MAX_BYTES || !TIPOS.test(String(meta.contentType))) {
        await archivo.delete().catch(() => {});
        return NextResponse.json({ error: "Cada foto debe ser imagen o PDF de máximo 5 MB." }, { status: 400 });
      }
    }

    const db = adminDb();
    const pedidoRef = db.collection("pedidos").doc(pedidoId);

    await db.runTransaction(async (tx) => {
      const alumno = await alumnoParaPedido(db, tx, cliente);
      if (alumno.existe) {
        const pendientes = await tx.get(
          db.collection("pedidos").where("alumnoId", "==", alumno.ref.id).where("estado", "==", "pendiente"),
        );
        if (pendientes.size >= 3) throw new ErrorUsuario("Ya tienes pagos pendientes de revisión. Te escribiremos pronto.");
        tx.update(alumno.ref, datosAlumno(cliente));
      } else {
        tx.set(alumno.ref, { ...datosAlumno(cliente), tieneAcceso: false, tokenAcceso: null, fechaRegistro: FieldValue.serverTimestamp() });
      }

      // La cuenta de Google pasa a "pendiente"
      tx.update(db.collection("usuarios").doc(sesion.uid), {
        estadoCompra: "pendiente",
        pedidoActual: pedidoId,
        telefono: cliente.telefono,
        motivoRechazo: null,
      });

      // create() falla si el pedido ya existe → evita duplicados
      tx.create(pedidoRef, {
        uid: sesion.uid,
        alumnoId: alumno.ref.id,
        nombre: nombreCompleto(cliente),
        email: cliente.email,
        whatsapp: cliente.telefono,
        metodo: "transferencia",
        monto,
        moneda: "DOP",
        estado: "pendiente",
        comprobantes: rutas,
        bancoDestino,
        cuentaId,
        codigoSeguimiento: codigo,
        bancoOrigen,
        fechaTransferencia,
        referencia,
        nota,
        motivoRechazo: null,
        historial: [{ estado: "pendiente", fecha: Timestamp.now(), nota: "Comprobante enviado" }],
        creadoEn: FieldValue.serverTimestamp(),
        revisadoEn: null,
        revisadoPor: null,
      });
    });

    const admin = process.env.ADMIN_EMAIL;
    if (admin) {
      const c = correos.nuevoPedidoAdmin(
        { nombre: nombreCompleto(cliente), email: cliente.email, whatsapp: cliente.telefono, monto, referencia: referencia || "—" },
        `${urlSitio()}/admin`,
      );
      await enviarCorreo(admin, c.asunto, c.html);
    }
    return NextResponse.json({ ok: true, codigo });
  } catch (e) {
    if (e instanceof ErrorUsuario) return NextResponse.json({ error: e.message }, { status: 429 });
    if ((e as { code?: number }).code === 6) return NextResponse.json({ error: "Este pedido ya fue enviado." }, { status: 409 });
    console.error("Error registrando transferencia:", e);
    return NextResponse.json({ error: "No pudimos registrar tu pago. Inténtalo de nuevo." }, { status: 500 });
  }
}
