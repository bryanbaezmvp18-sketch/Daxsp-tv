import "server-only";
import { marca, curso } from "@/config/curso";

/**
 * Envío de correos con Resend (API REST). Si no hay RESEND_API_KEY,
 * no falla: solo lo registra en consola (útil en desarrollo).
 */
export async function enviarCorreo(para: string, asunto: string, html: string) {
  const clave = process.env.RESEND_API_KEY;
  const de = process.env.CORREO_REMITENTE || `${marca.nombre} <onboarding@resend.dev>`;
  if (!clave) {
    console.info(`[correo no enviado: falta RESEND_API_KEY] para=${para} asunto="${asunto}"`);
    return { enviado: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: [para], subject: asunto, html }),
    });
    if (!res.ok) console.error("Resend respondió", res.status, await res.text());
    return { enviado: res.ok };
  } catch (e) {
    console.error("Error enviando correo:", e);
    return { enviado: false };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#07060d;font-family:Arial,sans-serif;color:#f4f2ff">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <p style="font-size:20px;font-weight:bold;margin:0 0 24px">${esc(marca.nombre)}</p>
    <div style="background:#100e1a;border:1px solid #232036;border-radius:16px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 12px">${esc(titulo)}</h1>
      <div style="color:#c9c6e0;font-size:15px;line-height:1.6">${cuerpo}</div>
      ${boton ? `<p style="margin:28px 0 8px"><a href="${boton.url}" style="background:#8b5cf6;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:bold;display:inline-block">${esc(boton.texto)}</a></p>` : ""}
    </div>
    <p style="color:#a29fbd;font-size:12px;margin-top:20px">¿Dudas? Responde a este correo o escríbenos a ${esc(marca.soporteEmail)}.</p>
  </div></body></html>`;
}

export const correos = {
  bienvenida: (nombre: string, enlace: string) => ({
    asunto: `¡Tu acceso a ${curso.nombre} está listo! 🎉`,
    html: plantilla(
      `¡Bienvenido, ${nombre.split(" ")[0]}!`,
      `Confirmamos tu pago. Ya puedes entrar a <b>${esc(curso.nombre)}</b>: inicia sesión con tu cuenta de Google y lo encontrarás en «Mi cuenta».`,
      { texto: "Entrar al curso", url: enlace },
    ),
  }),
  rechazo: (nombre: string, motivo: string, urlCheckout: string) => ({
    asunto: `No pudimos confirmar tu pago de ${curso.nombre}`,
    html: plantilla(
      `Hola ${nombre.split(" ")[0]}, revisamos tu comprobante`,
      `No pudimos confirmar tu pago por este motivo:<br><br><i>${esc(motivo)}</i><br><br>Puedes volver a enviar tu comprobante desde el siguiente botón.`,
      { texto: "Volver a subir el comprobante", url: urlCheckout },
    ),
  }),
  nuevoPedidoAdmin: (p: { nombre: string; email: string; whatsapp: string; monto: number; referencia: string }, urlAdmin: string) => ({
    asunto: `🧾 Nueva transferencia por verificar — ${p.nombre}`,
    html: plantilla(
      "Nueva transferencia pendiente",
      `<b>${esc(p.nombre)}</b> (${esc(p.email)} · ${esc(p.whatsapp)})<br>Monto reportado: <b>RD$${p.monto.toLocaleString("es-DO")}</b><br>Referencia: ${esc(p.referencia)}`,
      { texto: "Revisar en el panel", url: urlAdmin },
    ),
  }),
};
