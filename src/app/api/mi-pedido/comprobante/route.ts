import { NextResponse, type NextRequest } from "next/server";
import { clienteActual } from "@/lib/cliente-sesion";
import { adminDb } from "@/lib/firebase/admin";
import { urlTemporal } from "@/lib/archivos";

export const runtime = "nodejs";

/**
 * Foto del comprobante que subió el propio cliente (de su pedido actual).
 * Redirige a una URL temporal de 15 min; nadie más puede verla.
 */
export async function GET(req: NextRequest) {
  const cliente = await clienteActual();
  if (!cliente) return new NextResponse(null, { status: 401 });

  const i = Number(req.nextUrl.searchParams.get("i") ?? 0);
  const db = adminDb();
  const pedidoId = (await db.collection("usuarios").doc(cliente.uid).get()).get("pedidoActual") as string | undefined;
  if (!pedidoId || !Number.isInteger(i) || i < 0 || i > 2) return new NextResponse(null, { status: 404 });

  const pedido = await db.collection("pedidos").doc(pedidoId).get();
  if (pedido.get("uid") !== cliente.uid) return new NextResponse(null, { status: 403 });
  const ruta = ((pedido.get("comprobantes") as string[] | undefined) ?? [])[i];
  if (!ruta) return new NextResponse(null, { status: 404 });

  // Redirección (URL firmada de Storage, o ruta relativa con emuladores)
  return new NextResponse(null, {
    status: 302,
    headers: { Location: await urlTemporal(ruta), "Cache-Control": "private, no-store" },
  });
}
