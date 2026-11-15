import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TarjetaAuth } from "@/components/auth/TarjetaAuth";
import { FormularioAdmin } from "@/components/admin/FormularioAdmin";
import { adminActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Admin · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ caducada?: string }> }) {
  const { caducada } = await searchParams;
  if (await adminActual()) redirect("/admin");
  return (
    <TarjetaAuth titulo="Panel de administración" subtitulo="Acceso solo para el administrador.">
      <FormularioAdmin caducada={caducada === "1"} />
    </TarjetaAuth>
  );
}
