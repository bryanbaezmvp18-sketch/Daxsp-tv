import { NextResponse } from "next/server";
import { lectorCurso } from "@/lib/acceso-curso";
import { adminBucket, adminDb } from "@/lib/firebase/admin";
import { urlTemporal } from "@/lib/archivos";

export const runtime = "nodejs";

const MAX_TEXTO = 300 * 1024; // los textos más grandes solo se descargan

/**
 * Solo alumnos con acceso. Devuelve una URL temporal (15 min) para descargar
 * y, si es un texto pequeño (guía, plantilla, script), también su contenido
 * para leerlo y copiarlo en la web.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const alumno = await lectorCurso();
  if (!alumno) return NextResponse.json({ error: "Sin acceso" }, { status: 401 });

  const { id } = await params;
  if (!/^[a-z0-9.-]{1,100}$/.test(id)) return NextResponse.json({ error: "Material inválido" }, { status: 400 });
  const doc = await adminDb().collection("materiales").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

  const ruta = doc.get("rutaArchivo") as string;
  const url = await urlTemporal(ruta, { descargar: doc.get("tipo") === "video" ? undefined : (doc.get("archivo") as string) });

  let texto: string | null = null;
  if (doc.get("esTexto") === true && Number(doc.get("bytes")) <= MAX_TEXTO) {
    const [buf] = await adminBucket().file(ruta).download();
    texto = buf.toString("utf8");
  }
  return NextResponse.json({ url, texto }, { headers: { "Cache-Control": "no-store" } });
}
