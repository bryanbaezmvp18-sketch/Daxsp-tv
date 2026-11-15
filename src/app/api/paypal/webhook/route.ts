import { NextResponse, type NextRequest } from "next/server";
import { consultarOrden, verificarWebhook } from "@/lib/paypal";
import { registrarPagoPayPal } from "@/lib/pedidos-paypal";

export const runtime = "nodejs";

/**
 * Webhook de respaldo (PAYMENT.CAPTURE.COMPLETED): si el cliente cerró la
 * ventana antes de volver, aquí se registra el pago igualmente.
 * Se verifica la firma con PayPal antes de hacer nada.
 */
export async function POST(req: NextRequest) {
  const evento = await req.json().catch(() => null);
  if (!evento || !(await verificarWebhook(req.headers, evento))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (evento.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId = evento.resource?.supplementary_data?.related_ids?.order_id;
    if (orderId) {
      try {
        // Volvemos a consultar la orden en PayPal en vez de confiar en el cuerpo del evento
        const captura = await consultarOrden(orderId);
        if (captura) await registrarPagoPayPal(orderId, captura, "webhook");
      } catch (e) {
        console.error("Webhook PayPal:", e);
        // 500 → PayPal reintentará más tarde
        return NextResponse.json({ error: "Error procesando" }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
