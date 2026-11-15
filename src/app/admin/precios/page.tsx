import type { Metadata } from "next";
import type { Timestamp } from "firebase-admin/firestore";
import { requerirAdmin } from "@/lib/sesion";
import { adminDb } from "@/lib/firebase/admin";
import { preciosParaCobrar } from "@/lib/precios";
import { CabeceraAdmin } from "@/components/admin/CabeceraAdmin";
import { EditorPrecios } from "@/components/admin/EditorPrecios";

export const metadata: Metadata = { title: "Precios · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PreciosPage() {
  const yo = await requerirAdmin();
  const [precios, doc] = await Promise.all([preciosParaCobrar(), adminDb().collection("config").doc("precios").get()]);
  const cuando = (doc.get("actualizadoEn") as Timestamp | undefined)
    ?.toDate()
    .toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" });

  return (
    <>
      <CabeceraAdmin email={yo.email} expira={yo.expira} activa="precios" />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Precios del curso</h1>
        <p className="mt-2 text-sm text-suave">
          Al guardar, el precio cambia al instante en la página principal y en el pago para todos los clientes.
        </p>
        {doc.exists && cuando && (
          <p className="mt-1 text-xs text-suave">
            Último cambio: {cuando} por {doc.get("actualizadoPor")}
          </p>
        )}
        <EditorPrecios inicial={precios} />
      </main>
    </>
  );
}
