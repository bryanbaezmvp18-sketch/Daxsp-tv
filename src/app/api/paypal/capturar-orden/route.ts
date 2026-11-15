import { NextResponse, type NextRequest } from "next/server";
import { capturarOrden } from "@/lib/paypal";
import { registrarPagoPayPal } from "@/lib/pedidos-paypal";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** Captura en el servidor, verifica COMPLETED + monto, da acceso y devuelve el enlace del alumno. */
export async function POST(req: NextRequest) {
  const { orderId } = await req.json().catch(() => ({}));
  if (typeof orderId !== "string" || !/^[A-Z0-9]{10,30}$/.test(orderId)) {
    return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
  }
  // Solo órdenes creadas por esta web
  if (!(await adminDb().collection("ordenesPaypal").doc(orderId).get()).exists) {
    return NextResponse.json({ error: "Orden desconocida" }, { status: 404 });
  }

  try {
    const captura = await capturarOrden(orderId);
    if (!captura) return NextResponse.json({ error: "PayPal no pudo procesar el pago. Prueba con otro método." }, { status: 402 });
    if (captura.estado !== "COMPLETED") {
      return NextResponse.json(
        { error: captura.estado === "PENDING" ? "Tu pago está en revisión por PayPal. Te avisaremos al confirmarse." : "El pago fue rechazado." },
        { status: 402 },
      );
    }
    await registrarPagoPayPal(orderId, captura, "captura");
    return NextResponse.json({ ok: true, acceso: "/mi-cuenta" }); // ahí ve su curso desbloqueado
  } catch (e) {
    console.error("Error capturando orden PayPal:", e);
    return NextResponse.json({ error: "Hubo un problema confirmando tu pago. Escríbenos y lo resolvemos." }, { status: 500 });
  }
}
