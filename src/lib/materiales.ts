import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export type TipoMaterial = "guia" | "kit" | "plantilla" | "video" | "documento";

/** materiales/{id}: archivos del curso subidos con `npm run subir-curso`. */
export interface Material {
  id: string;
  titulo: string;
  archivo: string;
  carpeta: string;
  tipo: TipoMaterial;
  esTexto: boolean;
  descripcion: string;
  bytes: number;
}

export interface MaterialInterno extends Material {
  rutaArchivo: string;
}

export async function obtenerMateriales(): Promise<MaterialInterno[]> {
  const snap = await adminDb().collection("materiales").orderBy("orden").get();
  return snap.docs.map((d) => {
    const m = d.data();
    return {
      id: d.id,
      titulo: m.titulo,
      archivo: m.archivo,
      carpeta: m.carpeta ?? "",
      tipo: m.tipo,
      esTexto: m.esTexto === true,
      descripcion: m.descripcion ?? "",
      bytes: m.bytes ?? 0,
      rutaArchivo: m.rutaArchivo,
    };
  });
}

/** Lo que se envía al navegador (sin la ruta interna de Storage). */
export const aPublico = ({ rutaArchivo: _r, ...m }: MaterialInterno): Material => m;
