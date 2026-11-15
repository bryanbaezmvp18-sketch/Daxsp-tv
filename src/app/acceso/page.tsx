import Link from "next/link";
import type { Metadata } from "next";
import { CabeceraSimple } from "@/components/CabeceraSimple";
import { marca } from "@/config/curso";

export const metadata: Metadata = { title: "Acceso al curso · Daxsp TV", robots: { index: false } };

export default async function AccesoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <CabeceraSimple />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="tarjeta p-8">
          <div className="text-5xl" aria-hidden>{error ? "⚠️" : "🔒"}</div>
          <h1 className="mt-4 font-display text-2xl font-bold">
            {error ? "Este enlace no es válido" : "Entra con tu enlace personal"}
          </h1>
          <p className="mt-3 text-sm text-suave">
            {error
              ? "Puede que el enlace esté incompleto o que lo hayamos renovado. Escríbenos y te enviamos uno nuevo."
              : "Cuando confirmamos tu pago te enviamos por WhatsApp y correo un enlace para entrar al curso. Ábrelo desde este dispositivo."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {marca.whatsapp && (
              <a href={`https://wa.me/${marca.whatsapp}?text=${encodeURIComponent("Hola, necesito mi enlace de acceso al curso")}`} target="_blank" rel="noopener noreferrer" className="btn-primario">
                Pedir mi enlace por WhatsApp
              </a>
            )}
            <Link href="/#precio" className="btn-secundario">¿Aún no compras? Ver el curso</Link>
          </div>
        </div>
      </main>
    </>
  );
}
