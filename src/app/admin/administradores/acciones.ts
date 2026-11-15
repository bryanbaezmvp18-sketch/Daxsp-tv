"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requerirAdmin } from "@/lib/sesion";
import { urlSitio } from "@/lib/acceso";

type Resultado = { ok: true; enlace?: string; mensaje?: string } | { ok: false; error: string };

const correoValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/**
 * Enlace oficial de Firebase para que la persona cree (o cambie) su contraseña.
 * Al terminar vuelve al login del panel.
 */
async function enlaceContrasena(email: string) {
  const url = new URL(await adminAuth().generatePasswordResetLink(email, { url: `${urlSitio()}/admin/login` }));
  url.searchParams.set("lang", "es"); // página de Firebase en español
  return url.toString();
}

/**
 * Invita a un administrador: crea su usuario en Firebase Authentication (sin
 * contraseña), le da el permiso admin y lo registra en la colección
 * "administradores". Devuelve el enlace para que cree su propia contraseña.
 */
export async function invitarAdministrador(nombre: string, email: string): Promise<Resultado> {
  const yo = await requerirAdmin();
  nombre = nombre.trim().replace(/\s+/g, " ").slice(0, 80);
  email = email.trim().toLowerCase();
  if (nombre.length < 2) return { ok: false, error: "Escribe el nombre." };
  if (!correoValido(email)) return { ok: false, error: "El correo no es válido." };

  try {
    const auth = adminAuth();
    let usuario;
    try {
      usuario = await auth.getUserByEmail(email);
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
      usuario = await auth.createUser({ email, displayName: nombre, emailVerified: false });
    }
    if (usuario.disabled) await auth.updateUser(usuario.uid, { disabled: false });
    await auth.setCustomUserClaims(usuario.uid, { ...(usuario.customClaims ?? {}), admin: true });

    await adminDb().collection("administradores").doc(usuario.uid).set(
      {
        nombre,
        email,
        activo: true,
        agregadoPor: yo.email,
        fechaAlta: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    revalidatePath("/admin/administradores");
    // Si ya tenía contraseña (p. ej. ya era usuario), igual le sirve para entrar o cambiarla
    return { ok: true, enlace: await enlaceContrasena(email), mensaje: `${nombre} ya es administrador.` };
  } catch (e) {
    console.error("Error invitando administrador:", e);
    return { ok: false, error: "No se pudo crear el administrador. Inténtalo de nuevo." };
  }
}

/** Nuevo enlace para crear/cambiar la contraseña (si el anterior caducó). */
export async function enlaceNuevoAdministrador(uid: string): Promise<Resultado> {
  await requerirAdmin();
  const doc = await adminDb().collection("administradores").doc(uid).get();
  if (!doc.exists || doc.get("activo") !== true) return { ok: false, error: "Ese administrador no está activo." };
  return { ok: true, enlace: await enlaceContrasena(doc.get("email")) };
}

/** Quita el permiso de administrador y cierra todas sus sesiones al instante. */
export async function quitarAdministrador(uid: string): Promise<Resultado> {
  const yo = await requerirAdmin();
  if (uid === yo.uid) return { ok: false, error: "No puedes quitarte a ti mismo. Pídeselo al otro administrador." };

  const col = adminDb().collection("administradores");
  const activos = await col.where("activo", "==", true).get();
  if (!activos.docs.some((d) => d.id === uid)) return { ok: false, error: "Ese administrador ya no está activo." };
  if (activos.size <= 1) return { ok: false, error: "Debe quedar al menos un administrador." };

  const auth = adminAuth();
  const usuario = await auth.getUser(uid).catch(() => null);
  if (usuario) {
    const { admin: _quitado, ...resto } = usuario.customClaims ?? {};
    await auth.setCustomUserClaims(uid, resto);
    await auth.revokeRefreshTokens(uid); // invalida su sesión del panel
  }
  await col.doc(uid).update({ activo: false, quitadoPor: yo.email, fechaBaja: FieldValue.serverTimestamp() });
  revalidatePath("/admin/administradores");
  return { ok: true, mensaje: "Acceso de administrador retirado." };
}
