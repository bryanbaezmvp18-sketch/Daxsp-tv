import { NextResponse, type NextRequest } from "next/server";
import { alumnoPorToken, COOKIE_ACCESO, DURACION_ACCESO_S } from "@/lib/acceso";

export const runtime = "nodejs";

/** Enlace personal: /acceso/{token} → guarda la cookie y entra al curso. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const alumno = await alumnoPorToken(token);
  const destino = req.nextUrl.clone();
  destino.search = "";

  if (!alumno) {
    destino.pathname = "/acceso";
    destino.searchParams.set("error", "enlace");
    return NextResponse.redirect(destino);
  }

  destino.pathname = "/mi-curso";
  const res = NextResponse.redirect(destino);
  res.cookies.set(COOKIE_ACCESO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_ACCESO_S,
  });
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
