import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * Sesión de CLIENTES (cuenta de Google). Separada de la de administradores
 * (lib/sesion.ts, cookie "__session", correo + contraseña).
 */
export const COOKIE_CLIENTE = "daxsp_cliente";
export const DURACION_CLIENTE_MS = 1000 * 60 * 60 * 24 * 14; // 14 días (máximo que permite Firebase)

export type EstadoCompra = "sin_compra" | "pendiente" | "aprobado" | "rechazado";

export interface ClienteSesion {
  uid: string;
  nombre: string;
  email: string;
  fotoURL: string | null;
  telefono: string;
  estadoCompra: EstadoCompra;
  fechaRegistro: string | null;
}

/** Verifica la cookie con el Admin SDK y lee usuarios/{uid}. */
export const clienteActual = cache(async (): Promise<ClienteSesion | null> => {
  const cookie = (await cookies()).get(COOKIE_CLIENTE)?.value;
  if (!cookie) return null;
  try {
    const t = await adminAuth().verifySessionCookie(cookie, true);
    const doc = await adminDb().collection("usuarios").doc(t.uid).get();
    if (!doc.exists) return null;
    const u = doc.data()!;
    return {
      uid: t.uid,
      nombre: u.nombre ?? "",
      email: u.email ?? "",
      fotoURL: u.fotoURL ?? null,
      telefono: u.telefono ?? "",
      estadoCompra: (u.estadoCompra as EstadoCompra) ?? "sin_compra",
      fechaRegistro: (u.fechaRegistro as Timestamp | undefined)?.toDate().toISOString() ?? null,
    };
  } catch {
    return null;
  }
});

export async function requerirCliente(desde = "/mi-cuenta") {
  const c = await clienteActual();
  if (!c) redirect(`/entrar?next=${encodeURIComponent(desde)}`);
  return c;
}

/** A dónde va cada cliente después de iniciar sesión. */
export const destinoSegunEstado = (estado: EstadoCompra) => (estado === "sin_compra" ? "/checkout" : "/mi-cuenta");
