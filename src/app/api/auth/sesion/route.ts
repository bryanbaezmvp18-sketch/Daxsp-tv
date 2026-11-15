import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { COOKIE_SESION, DURACION_SESION_MS } from "@/lib/sesion";

export const runtime = "nodejs";

/** POST: cambia el ID token del administrador por una cookie de sesión httpOnly. */
export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (typeof idToken !== "string") return NextResponse.json({ error: "Falta el token" }, { status: 400 });

  try {
    const token = await adminAuth().verifyIdToken(idToken, true);
    if (token.admin !== true) {
      return NextResponse.json({ error: "Esta cuenta no tiene permisos de administrador." }, { status: 403 });
    }
    if (Date.now() / 1000 - token.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Vuelve a iniciar sesión." }, { status: 401 });
    }
    const sesion = await adminAuth().createSessionCookie(idToken, { expiresIn: DURACION_SESION_MS });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_SESION, sesion, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: DURACION_SESION_MS / 1000,
    });
    return res;
  } catch (e) {
    console.error("Error creando sesión:", e);
    return NextResponse.json({ error: "No se pudo iniciar la sesión." }, { status: 401 });
  }
}

/** DELETE: cierra la sesión y revoca los tokens. */
export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_SESION)?.value;
  if (cookie) {
    try {
      const t = await adminAuth().verifySessionCookie(cookie);
      await adminAuth().revokeRefreshTokens(t.sub);
    } catch {}
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, "", { path: "/", maxAge: 0 });
  return res;
}
