import { NextResponse } from "next/server";
import { clienteActual, destinoSegunEstado } from "@/lib/cliente-sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ¿Este dispositivo ya tiene sesión de cliente? Lo usa el botón «Iniciar sesión»
 * para entrar directo (mismo dispositivo) o abrir Google (dispositivo nuevo).
 * Solo devuelve datos del propio cliente de la cookie.
 */
export async function GET() {
  const c = await clienteActual();
  const cabeceras = { "Cache-Control": "private, no-store" };
  if (!c) return NextResponse.json({ sesion: false }, { headers: cabeceras });
  return NextResponse.json(
    { sesion: true, nombre: c.nombre.split(" ")[0], fotoURL: c.fotoURL, destino: destinoSegunEstado(c.estadoCompra) },
    { headers: cabeceras },
  );
}
