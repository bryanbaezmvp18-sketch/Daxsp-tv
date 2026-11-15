"use client";

import type { User } from "firebase/auth";

/** Cambia el login de Firebase (cliente) por la cookie de sesión del servidor. Solo admin. */
export async function crearSesion(user: User) {
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/sesion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: null }));
    throw new Error(error ?? "No se pudo iniciar la sesión");
  }
}

export async function cerrarSesion() {
  await fetch("/api/auth/sesion", { method: "DELETE" });
}

const mensajes: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  "auth/network-request-failed": "Problema de conexión. Revisa tu internet.",
};

export function mensajeError(e: unknown) {
  const code = (e as { code?: string })?.code;
  if (code && mensajes[code]) return mensajes[code];
  return e instanceof Error && !code ? e.message : "Algo salió mal. Inténtalo de nuevo.";
}
