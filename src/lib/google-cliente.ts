"use client";

import type { User } from "firebase/auth";

const MARCA_REDIRECCION = "daxsp-google-redirect";

async function firebase() {
  const [{ clientAuth }, mod] = await Promise.all([import("@/lib/firebase/client"), import("firebase/auth")]);
  const auth = clientAuth();
  auth.languageCode = "es";
  // En la web, Firebase ya guarda la sesión de forma persistente (IndexedDB):
  // se mantiene aunque cierre la pestaña o el navegador. No se llama a
  // setPersistence porque, justo al volver de Google, borraría el resultado.
  return { auth, ...mod };
}

/** Cambia el login de Google por la cookie de sesión del servidor. Devuelve a dónde ir. */
async function crearSesionCliente(user: User): Promise<string> {
  const res = await fetch("/api/cliente/sesion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: await user.getIdToken() }),
  });
  const r = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(r.error ?? "No se pudo iniciar la sesión.");
  return r.destino as string;
}

/**
 * Inicia sesión con Google. Primero con ventana emergente; si el navegador
 * la bloquea (frecuente en móviles), usa redirección de página completa.
 * Devuelve el destino, o null si se fue a la redirección.
 */
export async function entrarConGoogle(): Promise<string | null> {
  const { auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await firebase();
  const proveedor = new GoogleAuthProvider();
  proveedor.setCustomParameters({ prompt: "select_account" });
  try {
    const { user } = await signInWithPopup(auth, proveedor);
    return await crearSesionCliente(user);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      try {
        sessionStorage.setItem(MARCA_REDIRECCION, "1");
      } catch {}
      await signInWithRedirect(auth, proveedor);
      return null;
    }
    throw e;
  }
}

/** Al volver de la redirección de Google, termina el inicio de sesión. */
export async function terminarRedireccion(): Promise<string | null> {
  let pendiente = false;
  try {
    pendiente = sessionStorage.getItem(MARCA_REDIRECCION) === "1";
    sessionStorage.removeItem(MARCA_REDIRECCION);
  } catch {}
  if (!pendiente) return null;
  const { auth, getRedirectResult } = await firebase();
  const r = await getRedirectResult(auth);
  const user = r?.user ?? auth.currentUser;
  return user ? crearSesionCliente(user) : null;
}

/** Si el navegador ya tiene la sesión de Google guardada, renueva la cookie sin pedir nada. */
export async function reanudarSesion(): Promise<string | null> {
  const { auth } = await firebase();
  await auth.authStateReady();
  return auth.currentUser ? crearSesionCliente(auth.currentUser) : null;
}

export async function salirCliente() {
  await fetch("/api/cliente/sesion", { method: "DELETE" });
  const { auth, signOut } = await firebase();
  await signOut(auth).catch(() => {});
}

export function mensajeErrorGoogle(e: unknown) {
  const code = (e as { code?: string })?.code;
  const mensajes: Record<string, string> = {
    "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
    "auth/cancelled-popup-request": "Cerraste la ventana de Google antes de terminar.",
    "auth/network-request-failed": "Problema de conexión. Revisa tu internet.",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase todavía.",
    "auth/operation-not-allowed": "El inicio con Google aún no está activado.",
  };
  if (code && mensajes[code]) return mensajes[code];
  return e instanceof Error && !code ? e.message : "No se pudo entrar con Google. Inténtalo de nuevo.";
}
