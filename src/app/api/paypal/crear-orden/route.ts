import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { crearOrden, paypalConfigurado } from "@/lib/paypal";
import { validarCliente } from "@/lib/cliente";
import { clienteActual } from "@/lib/cliente-sesion";
import { preciosParaCobrar } from "@/lib/precios";
import { curso } from "@/config/curso";

export const runtime = "nodejs";

/** Crea la orden en PayPal con el precio del SERVIDOR (nunca el del navegador). */
export async function POST(req: NextRequest) {
  if (!paypalConfigurado()) return NextResponse.json({ error: "El pago con tarjeta aún no está disponible." }, { status: 503 });

  const sesion = await clienteActual();
  if (!sesion) return NextResponse.json({ error: "Entra con tu cuenta de Google para pagar." }, { status: 401 });
  if (sesion.estadoCompra === "pendiente" || sesion.estadoCompra === "aprobado") {
    return NextResponse.json({ error: "Ya tienes un pago registrado. Revisa «Mi cuenta»." }, { status: 409 });
  }

  const b = await req.json().catch(() => ({}));
  const v = validarCliente({ ...b, email: sesion.email });
  if ("errores" in v) return NextResponse.json({ error: v.errores.join(" ") }, { status: 400 });

  try {
    const ref = randomUUID();
    const monto = (await preciosParaCobrar()).usd.toFixed(2); // precio vigente, leído en el servidor
    const orderId = await crearOrden({ monto, moneda: "USD", descripcion: curso.nombre, customId: ref });
    await adminDb().collection("ordenesPaypal").doc(orderId).set({
      cliente: v.datos,
      uid: sesion.uid,
      ref,
      monto,
      moneda: "USD",
      estado: "creada",
      creadaEn: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: orderId });
  } catch (e) {
    console.error("Error creando orden PayPal:", e);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Inténtalo de nuevo." }, { status: 502 });
  }
}
