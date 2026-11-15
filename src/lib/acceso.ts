import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Acceso de alumnos SIN cuenta: al aprobar un pago se genera un token
 * secreto. El enlace /acceso/{token} guarda ese token en una cookie httpOnly
 * y cada página/API del curso lo verifica en el servidor.
 */
export const COOKIE_ACCESO = "daxsp_acceso";
export const DURACION_ACCESO_S = 60 * 60 * 24 * 365; // 1 año (se renueva en cada enlace)

export function generarToken() {
  return randomBytes(32).toString("base64url");
}

export function urlSitio() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function enlaceAcceso(token: string) {
  return `${urlSitio()}/acceso/${token}`;
}

export interface AlumnoSesion {
  id: string;
  nombre: string;
  email: string;
}

const tokenValido = (t: string) => /^[A-Za-z0-9_-]{40,60}$/.test(t);

export async function alumnoPorToken(token: string): Promise<AlumnoSesion | null> {
  if (!tokenValido(token)) return null;
  const snap = await adminDb().collection("alumnos").where("tokenAcceso", "==", token).limit(1).get();
  const doc = snap.docs[0];
  if (!doc || doc.get("tieneAcceso") !== true) return null;
  return { id: doc.id, nombre: doc.get("nombre"), email: doc.get("email") };
}

/** Alumno de la cookie actual (verificado contra Firestore en cada petición). */
export const alumnoActual = cache(async () => {
  const token = (await cookies()).get(COOKIE_ACCESO)?.value;
  return token ? alumnoPorToken(token) : null;
});

export async function requerirAlumno() {
  const a = await alumnoActual();
  if (!a) redirect("/acceso");
  return a;
}
