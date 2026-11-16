import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/sesion";
import { obtenerMateriales } from "@/lib/materiales";
import { CabeceraAdmin } from "@/components/admin/CabeceraAdmin";
import { GestionCurso, type MaterialAdmin } from "@/components/admin/GestionCurso";

export const metadata: Metadata = { title: "Archivos del curso · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CursoAdminPage() {
  const yo = await requerirAdmin();
  const materiales: MaterialAdmin[] = (await obtenerMateriales()).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    descripcion: m.descripcion,
    archivo: m.archivo,
    carpeta: m.carpeta,
    tipo: m.tipo,
    bytes: m.bytes,
  }));

  return (
    <>
      <CabeceraAdmin email={yo.email} expira={yo.expira} activa="curso" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Archivos del curso</h1>
        <p className="mt-2 text-sm text-suave">
          Esto es lo que ven y descargan tus alumnos en <b className="text-texto">«Mi cuenta» → Tu curso</b>. Los cambios se ven
          al momento. Los archivos son privados: solo los alumnos aprobados pueden abrirlos.
        </p>
        <GestionCurso materiales={materiales} />
      </main>
    </>
  );
}
