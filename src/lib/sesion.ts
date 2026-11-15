import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * Sesión SOLO para administradores (correo + contraseña).
 * Se guarda en una cookie persistente: sigue activa aunque cierres el
 * navegador, y caduca sola 5 horas después de iniciar sesión.
 */
export const COOKIE_SESION = "__session";
export const DURACION_SESION_MS = 1000 * 60 * 60 * 5; // 5 horas

export interface AdminSesion {
  uid: string;
  email: string;
  /** Momento (ms) en que la sesión caduca */
  expira: number;
}

/** Verifica la cookie con el Admin SDK (incluida revocación) y el claim admin=true. */
export const adminActual = cache(async (): Promise<AdminSesion | null> => {
  const cookie = (await cookies()).get(COOKIE_SESION)?.value;
  if (!cookie) return null;
  try {
    const t = await adminAuth().verifySessionCookie(cookie, true);
    return t.admin === true ? { uid: t.uid, email: t.email ?? "", expira: t.exp * 1000 } : null;
  } catch {
    return null;
  }
});

export async function requerirAdmin() {
  const a = await adminActual();
  if (!a) redirect("/admin/login?caducada=1");
  return a;
}
