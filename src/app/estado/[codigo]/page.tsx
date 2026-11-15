import Link from "next/link";
import type { Metadata } from "next";
import { CabeceraSimple } from "@/components/CabeceraSimple";
import { ActualizarSolo } from "@/components/estado/ActualizarSolo";
import { GuardarEnlace } from "@/components/estado/GuardarEnlace";
import { estadoPorCodigo } from "@/lib/estado-pedido";
import { formatoDOP, formatoUSD, marca } from "@/config/curso";

export const metadata: Metadata = { title: "Estado de tu pago · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

const PASOS = ["Comprobante enviado", "En revisión", "Confirmado"];

export default async function EstadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const p = await estadoPorCodigo(codigo);
  const whatsapp = marca.whatsapp ? `https://wa.me/${marca.whatsapp}?text=${encodeURIComponent("Hola, tengo una pregunta sobre mi pago del curso")}` : null;

  if (!p) {
    return (
      <>
        <CabeceraSimple />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="text-5xl" aria-hidden>🔍</div>
          <h1 className="mt-4 font-display text-2xl font-bold">No encontramos este pedido</h1>
          <p className="mt-2 text-sm text-suave">Revisa que el enlace esté completo o escríbenos y te ayudamos.</p>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-secundario mt-6">Escríbenos por WhatsApp</a>}
        </main>
      </>
    );
  }

  const paso = p.estado === "aprobado" ? 2 : 1;
  const monto = p.moneda === "USD" ? formatoUSD(p.monto) : formatoDOP(p.monto);

  return (
    <>
      <CabeceraSimple />
      {p.estado === "pendiente" && <ActualizarSolo segundos={20} />}
      <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        {/* Progreso */}
        {p.estado !== "rechazado" && p.estado !== "retirado" && (
          <ol className="mb-8 grid grid-cols-3 gap-2 text-center text-xs" aria-label="Progreso de tu pago">
            {PASOS.map((t, i) => (
              <li key={t} aria-current={i === paso ? "step" : undefined}>
                <div className={`mx-auto h-1.5 rounded-full ${i <= paso ? "bg-linear-to-r from-marca-2 to-marca" : "bg-white/10"}`} />
                <span className={`mt-2 block ${i <= paso ? "text-texto" : "text-suave"}`}>{t}</span>
              </li>
            ))}
          </ol>
        )}

        <section className="tarjeta p-6 text-center sm:p-8">
          {p.estado === "pendiente" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-400/15 text-3xl" aria-hidden>⏳</div>
              <h1 className="mt-4 font-display text-2xl font-bold">Estamos verificando tu pago</h1>
              <p className="mt-2 text-suave">
                Gracias, {p.nombre}. Normalmente lo confirmamos en menos de 24 horas y te avisamos por WhatsApp.
              </p>
              <p className="mt-4 text-xs text-suave">Esta página se actualiza sola.</p>
            </>
          )}

          {p.estado === "aprobado" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 text-3xl" aria-hidden>✅</div>
              <h1 className="mt-4 font-display text-2xl font-bold">¡Pago confirmado!</h1>
              <p className="mt-2 text-suave">Bienvenido, {p.nombre}. Tu curso ya está listo.</p>
              {p.enlaceCurso && (
                <Link href={p.enlaceCurso} className="btn-primario mt-6 w-full text-base">
                  Entrar al curso →
                </Link>
              )}
            </>
          )}

          {p.estado === "rechazado" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-400/15 text-3xl" aria-hidden>⚠️</div>
              <h1 className="mt-4 font-display text-2xl font-bold">No pudimos confirmar tu pago</h1>
              {p.motivoRechazo && (
                <p className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-sm">
                  <span className="text-suave">Motivo: </span>
                  {p.motivoRechazo}
                </p>
              )}
              <p className="mt-3 text-sm text-suave">No te preocupes: puedes enviarnos el comprobante de nuevo.</p>
              <Link href="/checkout" className="btn-primario mt-6 w-full text-base">
                Enviar nuevo comprobante
              </Link>
            </>
          )}
          {p.estado === "retirado" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-400/15 text-3xl" aria-hidden>🔒</div>
              <h1 className="mt-4 font-display text-2xl font-bold">Tu acceso al curso fue retirado</h1>
              <p className="mt-2 text-sm text-suave">Si crees que es un error, escríbenos y lo revisamos.</p>
            </>
          )}
        </section>

        {/* Resumen discreto */}
        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-borde px-4 py-3 text-center text-xs">
          <div><dt className="text-suave">Monto</dt><dd className="mt-0.5 font-semibold">{monto}</dd></div>
          <div><dt className="text-suave">Cuenta</dt><dd className="mt-0.5 truncate font-semibold">{p.bancoDestino || "—"}</dd></div>
          <div><dt className="text-suave">Enviado</dt><dd className="mt-0.5 font-semibold">{p.enviado.split(",")[0]}</dd></div>
        </dl>

        {p.estado !== "aprobado" && <GuardarEnlace />}

        {whatsapp && (
          <p className="mt-6 text-center text-sm text-suave">
            ¿Dudas? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-marca-2 hover:underline">Escríbenos por WhatsApp</a>
          </p>
        )}
      </main>
    </>
  );
}
