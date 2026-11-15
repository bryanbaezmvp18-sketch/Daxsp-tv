import type { Metadata } from "next";
import type { Timestamp } from "firebase-admin/firestore";
import { requerirAdmin } from "@/lib/sesion";
import { adminDb } from "@/lib/firebase/admin";
import { CabeceraAdmin } from "@/components/admin/CabeceraAdmin";
import { GestionAdministradores, type AdminVista } from "@/components/admin/GestionAdministradores";

export const metadata: Metadata = { title: "Administradores · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

const fecha = (t?: Timestamp | null) =>
  t ? t.toDate().toLocaleDateString("es-DO", { dateStyle: "medium", timeZone: "America/Santo_Domingo" }) : "";

export default async function AdministradoresPage() {
  const yo = await requerirAdmin();
  const snap = await adminDb().collection("administradores").where("activo", "==", true).get();

  const admins: AdminVista[] = snap.docs
    .map((d) => ({
      uid: d.id,
      nombre: d.get("nombre") as string,
      email: d.get("email") as string,
      agregadoPor: (d.get("agregadoPor") as string) ?? "",
      fechaAlta: fecha(d.get("fechaAlta")),
      soyYo: d.id === yo.uid,
    }))
    .sort((a, b) => Number(b.soyYo) - Number(a.soyYo) || a.nombre.localeCompare(b.nombre));

  return (
    <>
      <CabeceraAdmin email={yo.email} expira={yo.expira} activa="administradores" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Administradores</h1>
        <p className="mt-2 text-sm text-suave">
          Personas que pueden entrar a este panel, aprobar pagos y dar acceso al curso. Cada una tiene su propia cuenta:
          nunca compartan contraseña.
        </p>
        <GestionAdministradores admins={admins} />
      </main>
    </>
  );
}
