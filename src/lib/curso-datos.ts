import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { Leccion, Modulo } from "@/lib/tipos";

export async function obtenerModulos(): Promise<Modulo[]> {
  const snap = await adminDb().collection("modulos").orderBy("orden").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Modulo, "id">) }));
}

export async function buscarLeccion(leccionId: string): Promise<Leccion | null> {
  for (const m of await obtenerModulos()) {
    const l = m.lecciones?.find((x) => x.id === leccionId);
    if (l) return l;
  }
  return null;
}

export async function obtenerProgreso(alumnoId: string): Promise<string[]> {
  const doc = await adminDb().collection("progreso").doc(alumnoId).get();
  return (doc.get("leccionesCompletadas") as string[] | undefined) ?? [];
}
