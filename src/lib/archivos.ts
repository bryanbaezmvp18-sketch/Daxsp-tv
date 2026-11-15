import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { adminBucket } from "@/lib/firebase/admin";

export const MINUTOS_URL = 15;
export const usandoEmulador = () => Boolean(process.env.FIREBASE_STORAGE_EMULATOR_HOST);

const secreto = () => process.env.ARCHIVOS_SECRETO || "solo-desarrollo-local";

/** Content-Disposition que conserva tildes y ñ en el nombre del archivo descargado. */
export function disposicionDescarga(nombre: string) {
  const ascii = nombre.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}

export function firmar(ruta: string, exp: number) {
  return createHmac("sha256", secreto()).update(`${ruta}|${exp}`).digest("base64url");
}

export function firmaValida(ruta: string, exp: number, sig: string) {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const a = Buffer.from(firmar(ruta, exp));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * URL temporal (15 min) para un archivo PRIVADO de Storage.
 * - Producción: URL firmada V4 de Google Cloud Storage.
 * - Emuladores: el emulador no puede firmar, así que se usa /api/archivo
 *   con una firma HMAC propia que caduca igual.
 */
export async function urlTemporal(ruta: string, opciones: { descargar?: string } = {}) {
  const exp = Date.now() + MINUTOS_URL * 60 * 1000;
  if (usandoEmulador()) {
    const q = new URLSearchParams({ ruta, exp: String(exp), sig: firmar(ruta, exp) });
    if (opciones.descargar) q.set("descargar", opciones.descargar);
    return `/api/archivo?${q}`;
  }
  const [url] = await adminBucket()
    .file(ruta)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: exp,
      ...(opciones.descargar && {
        responseDisposition: disposicionDescarga(opciones.descargar),
      }),
    });
  return url;
}
