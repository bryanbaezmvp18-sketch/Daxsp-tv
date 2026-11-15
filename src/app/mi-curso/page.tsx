import type { Metadata } from "next";
import { requerirAlumno } from "@/lib/acceso";
import { obtenerModulos, obtenerProgreso } from "@/lib/curso-datos";
import { aPublico, obtenerMateriales } from "@/lib/materiales";
import { CabeceraSimple } from "@/components/CabeceraSimple";
import { AreaCurso } from "@/components/curso/AreaCurso";
import { Materiales } from "@/components/curso/Materiales";
import { curso, marca } from "@/config/curso";

export const metadata: Metadata = { title: "Mi curso · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MiCursoPage() {
  const alumno = await requerirAlumno();
  const [materiales, modulos, completadas] = await Promise.all([
    obtenerMateriales().then((ms) => ms.map(aPublico)),
    obtenerModulos(),
    obtenerProgreso(alumno.id),
  ]);
  const whatsapp = marca.whatsapp ? `https://wa.me/${marca.whatsapp}?text=${encodeURIComponent("Hola, necesito ayuda con el curso")}` : null;

  return (
    <>
      <CabeceraSimple>
        <span className="max-w-40 truncate text-suave">Hola, {alumno.nombre.split(" ")[0]} 👋</span>
      </CabeceraSimple>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{curso.nombre}</h1>
        <p className="mt-1 mb-8 text-suave">Todo tu material, en orden. Sigue los pasos de arriba hacia abajo.</p>

        {materiales.length > 0 && <Materiales materiales={materiales} />}

        {modulos.length > 0 && (
          <section className="mt-12" aria-labelledby="sec-lecciones">
            <h2 id="sec-lecciones" className="font-display text-lg font-semibold">🎓 Lecciones en video</h2>
            <AreaCurso modulos={modulos} completadasIniciales={completadas} />
          </section>
        )}

        {!materiales.length && !modulos.length && (
          <p className="tarjeta p-6 text-suave">El contenido del curso se está preparando. Vuelve pronto.</p>
        )}

        {whatsapp && (
          <p className="mt-12 text-center text-sm text-suave">
            ¿Te trabaste en algún paso?{" "}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-marca-2 hover:underline">
              Escríbenos por WhatsApp
            </a>
          </p>
        )}
      </main>
    </>
  );
}
