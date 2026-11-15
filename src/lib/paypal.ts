import "server-only";

/** Cliente mínimo de la API REST de PayPal (Orders v2). */
const BASE = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export const paypalConfigurado = () =>
  Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

let cache: { token: string; vence: number } | null = null;

async function token() {
  if (cache && cache.vence > Date.now() + 60_000) return cache.token;
  const cred = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${cred}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal OAuth ${res.status}: ${await res.text()}`);
  const j = await res.json();
  cache = { token: j.access_token, vence: Date.now() + j.expires_in * 1000 };
  return cache.token;
}

async function llamar(ruta: string, init: RequestInit & { idempotencia?: string } = {}) {
  const res = await fetch(`${BASE}${ruta}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Content-Type": "application/json",
      ...(init.idempotencia && { "PayPal-Request-Id": init.idempotencia }),
      ...init.headers,
    },
  });
  const cuerpo = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, cuerpo };
}

export interface CapturaPayPal {
  estado: string; // COMPLETED, PENDING, DECLINED...
  captureId: string;
  monto: string;
  moneda: string;
  customId: string;
}

function leerCaptura(orden: Record<string, any>): CapturaPayPal | null {
  const unidad = orden?.purchase_units?.[0];
  const cap = unidad?.payments?.captures?.[0];
  if (!cap) return null;
  return {
    estado: cap.status,
    captureId: cap.id,
    monto: cap.amount?.value,
    moneda: cap.amount?.currency_code,
    customId: cap.custom_id ?? unidad?.custom_id ?? "",
  };
}

export async function crearOrden(p: { monto: string; moneda: string; descripcion: string; customId: string }) {
  const r = await llamar("/v2/checkout/orders", {
    method: "POST",
    idempotencia: `crear-${p.customId}`,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: p.customId,
          description: p.descripcion.slice(0, 127),
          amount: { currency_code: p.moneda, value: p.monto },
        },
      ],
      application_context: { shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW", brand_name: "Daxsp TV" },
    }),
  });
  if (!r.ok) throw new Error(`PayPal crear orden ${r.status}: ${JSON.stringify(r.cuerpo)}`);
  return r.cuerpo.id as string;
}

/** Captura la orden. Si ya estaba capturada, la consulta (idempotente). */
export async function capturarOrden(orderId: string): Promise<CapturaPayPal | null> {
  const r = await llamar(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    idempotencia: `capturar-${orderId}`,
  });
  if (r.ok) return leerCaptura(r.cuerpo);
  if (r.cuerpo?.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED") return consultarOrden(orderId);
  console.error("PayPal capturar", r.status, JSON.stringify(r.cuerpo));
  return null;
}

export async function consultarOrden(orderId: string) {
  const r = await llamar(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  return r.ok ? leerCaptura(r.cuerpo) : null;
}

/** Verifica la firma de un webhook con la API de PayPal. */
export async function verificarWebhook(headers: Headers, evento: unknown) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const r = await llamar("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: evento,
    }),
  });
  return r.ok && r.cuerpo?.verification_status === "SUCCESS";
}
