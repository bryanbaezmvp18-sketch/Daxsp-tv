import Link from "next/link";
import type { Metadata } from "next";
import { requerirCliente } from "@/lib/cliente-sesion";
import { miPedido } from "@/lib/mi-pedido";
import { aPublico, obtenerMateriales } from "@/lib/materiales";
import { obtenerModulos, obtenerProgreso } from "@/lib/curso-datos";
import { CabeceraSimple } from "@/components/CabeceraSimple";
import { BotonSalirCliente } from "@/components/cliente/BotonSalirCliente";
import { LineaTiempo } from "@/components/cliente/LineaTiempo";
import { EscuchaEstado } from "@/components/cliente/EscuchaEstado";
import { Materiales } from "@/components/curso/Materiales";
import { AreaCurso } from "@/components/curso/AreaCurso";
import { formatoDOP, formatoUSD, marca } from "@/config/curso";

export const metadata: Metadata = { title: "Mi cuenta · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

const ETIQUETA = {
  sin_compra: { texto: "Sin compra", color: "bg-white/10 text-suave" },
  pendiente: { texto: "En revisión", color: "bg-amber-400/15 text-amber-300" },
  aprobado: { texto: "Aprobado", color: "bg-emerald-400/15 text-emerald-300" },
  rechazado: { texto: "Rechazado", color: "bg-red-400/15 text-red-300" },
  retirado: { texto: "Acceso retirado", color: "bg-red-400/15 text-red-300" },
};

/** Módulo del cliente: estado de su compra + su curso (cuando está aprobado). */
export default async function MiCuentaPage() {
  const c = await requerirCliente();
  const aprobado = c.estadoCompra === "aprobado";
  const [pedido, materiales, modulos, completadas] = await Promise.all([
    c.estadoCompra === "sin_compra" ? null : miPedido(c.uid),
    aprobado ? obtenerMateriales().then((m) => m.map(aPublico)) : [],
    aprobado ? obtenerModulos() : [],
    aprobado ? obtenerProgreso(c.uid) : [],
  ]);
  const e = ETIQUETA[c.estadoCompra];
  const monto = pedido ? (pedido.moneda === "USD" ? formatoUSD(pedido.monto) : formatoDOP(pedido.monto)) : "";
  const whatsapp = marca.whatsapp ? `https://wa.me/${marca.whatsapp}?text=${encodeURIComponent("Hola, tengo una pregunta sobre mi compra del curso")}` : null;

  return (
    <>
      <CabeceraSimple>
        <BotonSalirCliente />
      </CabeceraSimple>
      {/* Se actualiza sola si el admin aprueba, rechaza o quita el acceso */}
      <EscuchaEstado uid={c.uid} estadoInicial={c.estadoCompra} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {/* Perfil */}
        <section className="flex items-center gap-4">
          {c.fotoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.fotoURL} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-marca/40" />
          ) : (
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-marca/20 text-xl font-bold text-marca-2">
              {c.nombre.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold sm:text-2xl">Hola, {c.nombre.split(" ")[0]} 👋</h1>
            <p className="truncate text-sm text-suave">{c.email}</p>
          </div>
        </section>

        {/* Estado de la compra */}
        <section className="tarjeta mt-6 p-5 sm:p-6" aria-labelledby="estado-compra">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="estado-compra" className="font-display text-lg font-semibold">Estado de tu compra</h2>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${e.color}`}>{e.texto}</span>
          </div>
          <LineaTiempo estado={c.estadoCompra} />

          <div className="mt-6 rounded-2xl bg-white/[.03] p-4 text-center sm:p-5">
            {c.estadoCompra === "sin_compra" && (
              <>
                <p className="text-suave">Aún no has comprado el curso.</p>
                <Link href="/checkout" className="btn-comprar mt-4">Comprar curso</Link>
              </>
            )}
            {c.estadoCompra === "pendiente" && (
              <>
                <p className="font-display text-lg font-bold">⏳ Estamos verificando tu pago</p>
                <p className="mt-1 text-sm text-suave">
                  Normalmente en menos de 24 horas. Cuando lo aprobemos, tu curso aparecerá aquí mismo, sin recargar.
                </p>
              </>
            )}
            {c.estadoCompra === "rechazado" && (
              <>
                <p className="font-display text-lg font-bold">⚠️ No pudimos confirmar tu pago</p>
                {pedido?.motivoRechazo && <p className="mt-2 rounded-xl bg-white/5 px-4 py-3 text-sm">Motivo: {pedido.motivoRechazo}</p>}
                <Link href="/checkout" className="btn-primario mt-4">Enviar nuevo comprobante</Link>
              </>
            )}
            {c.estadoCompra === "retirado" && (
              <>
                <p className="font-display text-lg font-bold">🔒 Tu acceso al curso fue retirado</p>
                {pedido?.motivoRetiro && <p className="mt-2 rounded-xl bg-white/5 px-4 py-3 text-sm">Motivo: {pedido.motivoRetiro}</p>}
                <p className="mt-2 text-sm text-suave">Si crees que es un error, escríbenos y lo revisamos.</p>
              </>
            )}
            {aprobado && (
              <>
                <p className="font-display text-lg font-bold">✅ ¡Pago confirmado!</p>
                <p className="mt-1 text-sm text-suave">
                  {pedido?.aprobado ? `Aprobado el ${pedido.aprobado}. ` : ""}Tu curso está desbloqueado aquí abajo.
                </p>
              </>
            )}
          </div>

          {/* Detalles del pago */}
          {pedido && (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-suave">Monto</dt><dd className="font-semibold">{monto}</dd></div>
              <div><dt className="text-xs text-suave">Método</dt><dd>{pedido.metodo === "paypal" ? "Tarjeta / PayPal" : "Transferencia"}</dd></div>
              <div><dt className="text-xs text-suave">Enviado</dt><dd>{pedido.enviado ?? "—"}</dd></div>
              <div><dt className="text-xs text-suave">Referencia</dt><dd className="break-all">{pedido.referencia || "—"}</dd></div>
              {pedido.bancoDestino && <div className="col-span-2"><dt className="text-xs text-suave">Cuenta</dt><dd>{pedido.bancoDestino}</dd></div>}
            </dl>
          )}
          {pedido && pedido.fotos > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-suave">Tu comprobante</p>
              <div className="flex gap-2">
                {Array.from({ length: pedido.fotos }, (_, i) => (
                  <a key={i} href={`/api/mi-pedido/comprobante?i=${i}`} target="_blank" rel="noopener noreferrer" className="block h-20 w-20 overflow-hidden rounded-xl border border-borde bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/mi-pedido/comprobante?i=${i}`} alt={`Comprobante ${i + 1}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Curso */}
        <section className="mt-8" aria-labelledby="tu-curso">
          <h2 id="tu-curso" className="mb-4 font-display text-xl font-bold">🎓 Tu curso</h2>
          {aprobado ? (
            <>
              {materiales.length > 0 && <Materiales materiales={materiales} />}
              {modulos.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-display text-lg font-semibold">Lecciones en video</h3>
                  <AreaCurso modulos={modulos} completadasIniciales={completadas} />
                </div>
              )}
              {!materiales.length && !modulos.length && <p className="tarjeta p-6 text-suave">El contenido se está preparando. Vuelve pronto.</p>}
            </>
          ) : (
            <div className="tarjeta relative overflow-hidden p-8 text-center">
              <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_12px,rgba(255,255,255,.02)_12px,rgba(255,255,255,.02)_24px)]" />
              <div className="relative">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/5 text-3xl" aria-hidden>🔒</div>
                <p className="mt-4 font-semibold">
                  {c.estadoCompra === "retirado" ? "Tu curso está bloqueado" : "Tu curso se desbloquea cuando se apruebe tu pago"}
                </p>
                <p className="mt-1 text-sm text-suave">Guía paso a paso, kit para Claude, plantillas y videos.</p>
              </div>
            </div>
          )}
        </section>

        {whatsapp && (
          <p className="mt-10 text-center text-sm text-suave">
            ¿Dudas? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-marca-2 hover:underline">Escríbenos por WhatsApp</a>
          </p>
        )}
      </main>
    </>
  );
}
