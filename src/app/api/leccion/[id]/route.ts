import { NextResponse } from "next/server";
import { lectorCurso } from "@/lib/acceso-curso";
import { buscarLeccion } from "@/lib/curso-datos";
import { urlTemporal } from "@/lib/archivos";

export const runtime = "nodejs";

/** Devuelve una URL temporal (15 min) del archivo de la lección, solo a alumnos con acceso. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const alumno = await lectorCurso();
  if (!alumno) return NextResponse.json({ error: "Sin acceso" }, { status: 401 });

  const leccion = await buscarLeccion((await params).id);
  if (!leccion) return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });

  const ext = leccion.rutaArchivo.split(".").pop();
  const url = await urlTemporal(leccion.rutaArchivo, {
    descargar: leccion.tipo === "pdf" ? `${leccion.titulo}.${ext}` : undefined,
  });
  return NextResponse.json({ url, tipo: leccion.tipo }, { headers: { "Cache-Control": "no-store" } });
}
