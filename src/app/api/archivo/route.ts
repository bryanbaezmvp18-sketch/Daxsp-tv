import { NextResponse, type NextRequest } from "next/server";
import { adminBucket } from "@/lib/firebase/admin";
import { disposicionDescarga, firmaValida, usandoEmulador } from "@/lib/archivos";

export const runtime = "nodejs";

/**
 * SOLO DESARROLLO (emuladores): sirve archivos privados con una firma que
 * caduca a los 15 min. En producción responde 404 y se usan URLs firmadas de GCS.
 */
export async function GET(req: NextRequest) {
  if (!usandoEmulador()) return new NextResponse(null, { status: 404 });

  const p = req.nextUrl.searchParams;
  const ruta = p.get("ruta") ?? "";
  if (!firmaValida(ruta, Number(p.get("exp")), p.get("sig") ?? "")) {
    return NextResponse.json({ error: "Enlace caducado o inválido" }, { status: 403 });
  }

  const archivo = adminBucket().file(ruta);
  const [existe] = await archivo.exists();
  if (!existe) return new NextResponse(null, { status: 404 });
  const [buf] = await archivo.download();
  const [meta] = await archivo.getMetadata();
  const tipo = String(meta.contentType ?? "application/octet-stream");
  const total = buf.length;

  const cabeceras: Record<string, string> = {
    "Content-Type": tipo,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  };
  const descargar = p.get("descargar");
  if (descargar) cabeceras["Content-Disposition"] = disposicionDescarga(descargar);

  // Soporte de rangos para poder adelantar el video
  const rango = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (rango) {
    const inicio = rango[1] ? Number(rango[1]) : 0;
    const fin = rango[2] ? Math.min(Number(rango[2]), total - 1) : total - 1;
    return new NextResponse(new Uint8Array(buf.subarray(inicio, fin + 1)), {
      status: 206,
      headers: { ...cabeceras, "Content-Range": `bytes ${inicio}-${fin}/${total}`, "Content-Length": String(fin - inicio + 1) },
    });
  }
  return new NextResponse(new Uint8Array(buf), { headers: { ...cabeceras, "Content-Length": String(total) } });
}
