import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COOKIE_CLIENTE, DURACION_CLIENTE_MS, destinoSegunEstado, type EstadoCompra } from "@/lib/cliente-sesion";

export const runtime = "nodejs";

/**
 * POST: recibe el ID token de Google (Firebase Auth), crea usuarios/{uid} la
 * primera vez (estadoCompra "sin_compra") o solo actualiza ultimoAcceso,
 * y devuelve una cookie de sesión httpOnly + a dónde redirigir.
 */
export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (typeof idToken !== "string") return NextResponse.json({ error: "Falta el token" }, { status: 400 });

  try {
    const token = await adminAuth().verifyIdToken(idToken, true);
    if (token.firebase?.sign_in_provider !== "google.com") {
      return NextResponse.json({ error: "Entra con tu cuenta de Google." }, { status: 403 });
    }

    const ref = adminDb().collection("usuarios").doc(token.uid);
    const estado = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        tx.set(ref, {
          nombre: token.name ?? token.email?.split("@")[0] ?? "Cliente",
          email: token.email ?? "",
          fotoURL: token.picture ?? null,
          proveedor: "google",
          fechaRegistro: FieldValue.serverTimestamp(),
          ultimoAcceso: FieldValue.serverTimestamp(),
          estadoCompra: "sin_compra",
        });
        return "sin_compra" as EstadoCompra;
      }
      // Ya existía: solo el último acceso (no se tocan sus demás datos)
      tx.update(ref, { ultimoAcceso: FieldValue.serverTimestamp() });
      return (snap.get("estadoCompra") as EstadoCompra) ?? "sin_compra";
    });

    const sesion = await adminAuth().createSessionCookie(idToken, { expiresIn: DURACION_CLIENTE_MS });
    const res = NextResponse.json({ ok: true, estado, destino: destinoSegunEstado(estado) });
    res.cookies.set(COOKIE_CLIENTE, sesion, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DURACION_CLIENTE_MS / 1000,
    });
    return res;
  } catch (e) {
    console.error("Error en sesión de cliente:", e);
    return NextResponse.json({ error: "No se pudo iniciar la sesión. Inténtalo de nuevo." }, { status: 401 });
  }
}

/** DELETE: cierra la sesión del cliente en este dispositivo. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_CLIENTE, "", { path: "/", maxAge: 0 });
  return res;
}
