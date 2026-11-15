import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TarjetaAuth } from "@/components/auth/TarjetaAuth";
import { BotonGoogle } from "@/components/cliente/BotonGoogle";
import { Reanudar } from "@/components/cliente/Reanudar";
import { clienteActual, destinoSegunEstado } from "@/lib/cliente-sesion";

export const metadata: Metadata = { title: "Entrar · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

const seguro = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : undefined);

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = seguro((await searchParams).next);
  const cliente = await clienteActual();
  if (cliente) redirect(next && cliente.estadoCompra !== "sin_compra" ? next : destinoSegunEstado(cliente.estadoCompra));

  return (
    <TarjetaAuth titulo="Entra a tu cuenta" subtitulo="Con tu cuenta de Google ves el estado de tu compra y tu curso.">
      <Reanudar next={next}>
        <BotonGoogle next={next} className="[&>button]:w-full" />
        <ul className="mt-6 space-y-2 text-sm text-suave">
          <li>✓ Sin contraseñas nuevas que recordar</li>
          <li>✓ Sigue tu pago y entra al curso desde cualquier dispositivo</li>
          <li>✓ Solo usamos tu nombre, correo y foto</li>
        </ul>
      </Reanudar>
    </TarjetaAuth>
  );
}
