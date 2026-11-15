import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { lectorCurso } from "@/lib/acceso-curso";
import { buscarLeccion } from "@/lib/curso-datos";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** Marca o desmarca una lección como completada. */
export async function POST(req: NextRequest) {
  const alumno = await lectorCurso();
  if (!alumno) return NextResponse.json({ error: "Sin acceso" }, { status: 401 });

  const { leccionId, completada } = await req.json().catch(() => ({}));
  if (typeof leccionId !== "string" || !(await buscarLeccion(leccionId))) {
    return NextResponse.json({ error: "Lección inválida" }, { status: 400 });
  }

  await adminDb()
    .collection("progreso")
    .doc(alumno.id)
    .set(
      {
        leccionesCompletadas: completada ? FieldValue.arrayUnion(leccionId) : FieldValue.arrayRemove(leccionId),
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  return NextResponse.json({ ok: true });
}
