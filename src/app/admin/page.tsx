import Link from "next/link";
import type { Metadata } from "next";
import type { Timestamp } from "firebase-admin/firestore";
import { requerirAdmin } from "@/lib/sesion";
import { adminDb } from "@/lib/firebase/admin";
import { enlaceAcceso } from "@/lib/acceso";
import { CabeceraAdmin } from "@/components/admin/CabeceraAdmin";
import { TarjetaPedido, type PedidoVista } from "@/components/admin/TarjetaPedido";
import { formatoDOP, formatoUSD } from "@/config/curso";

export const metadata: Metadata = { title: "Admin · Daxsp TV", robots: { index: false } };
export const dynamic = "force-dynamic";

const FILTROS = [
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "aprobado", texto: "Aprobados" },
  { valor: "rechazado", texto: "Rechazados" },
  { valor: "retirado", texto: "Acceso retirado" },
  { valor: "todos", texto: "Todos" },
] as const;

const fecha = (t?: Timestamp | null) =>
  t ? t.toDate().toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" }) : "";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ estado?: string; nuevo?: string }> }) {
  const admin = await requerirAdmin();
  const { estado: estadoParam, nuevo } = await searchParams;
  const estado = FILTROS.some((f) => f.valor === estadoParam) ? estadoParam! : "pendiente";

  const db = adminDb();
  // Para un curso con cientos de ventas basta con leer todo; si crece, paginar.
  const [pedidosSnap, alumnosSnap] = await Promise.all([
    db.collection("pedidos").orderBy("creadoEn", "desc").limit(500).get(),
    db.collection("alumnos").get(),
  ]);
  const alumnos = new Map(alumnosSnap.docs.map((d) => [d.id, d.data()]));

  const todos: PedidoVista[] = pedidosSnap.docs.map((d) => {
    const p = d.data();
    const a = alumnos.get(p.alumnoId);
    return {
      id: d.id,
      alumnoId: p.alumnoId,
      uid: p.uid ?? null,
      nombre: p.nombre,
      email: p.email,
      whatsapp: p.whatsapp,
      metodo: p.metodo,
      monto: p.monto,
      moneda: p.moneda,
      estado: p.estado,
      bancoOrigen: p.bancoOrigen ?? "",
      fechaTransferencia: p.fechaTransferencia ?? "",
      referencia: p.referencia ?? "",
      motivoRechazo: p.motivoRechazo ?? "",
      motivoRetiro: p.motivoRetiro ?? "",
      creadoMs: (p.creadoEn as Timestamp | undefined)?.toMillis() ?? 0,
      retiradoEn: fecha(p.retiradoEn),
      retiradoPor: p.retiradoPor ?? "",
      fotos: ((p.comprobantes as string[] | undefined) ?? [p.comprobanteRuta].filter(Boolean)).length,
      bancoDestino: p.bancoDestino ?? "",
      nota: p.nota ?? "",
      paypalOrderId: p.paypalOrderId ?? "",
      creadoEn: fecha(p.creadoEn),
      revisadoEn: fecha(p.revisadoEn),
      revisadoPor: p.revisadoPor ?? "",
      alumnoConAcceso: a?.tieneAcceso === true,
      // Con cuenta de Google el curso se ve en «Mi cuenta»: no hace falta enlace
      enlace: !p.uid && a?.tieneAcceso && a?.tokenAcceso ? enlaceAcceso(a.tokenAcceso) : null,
    };
  });

  const filtrados = estado === "todos" ? todos : todos.filter((p) => p.estado === estado);
  // Pendientes: el que más lleva esperando primero (cola de revisión). El resto: lo más reciente primero.
  const visibles = estado === "pendiente" ? [...filtrados].sort((a, b) => a.creadoMs - b.creadoMs) : filtrados;
  const AYUDA: Record<string, string> = {
    pendiente: "Ordenados por antigüedad: el que más lleva esperando aparece primero.",
    aprobado: "Clientes con el curso desbloqueado. Desde aquí puedes quitarles el acceso.",
    rechazado: "Pagos que no se pudieron confirmar. El cliente puede enviar otro comprobante.",
    retirado: "Clientes a los que se les quitó el acceso. Puedes devolvérselo cuando quieras.",
    todos: "Todos los pedidos, del más reciente al más antiguo.",
  };
  const aprobados = todos.filter((p) => p.estado === "aprobado");
  const conteo = (e: string) => (e === "todos" ? todos.length : todos.filter((p) => p.estado === e).length);
  const sumar = (m: string) => aprobados.filter((p) => p.moneda === m).reduce((n, p) => n + Number(p.monto || 0), 0);
  const alumnosActivos = alumnosSnap.docs.filter((d) => d.get("tieneAcceso") === true).length;

  return (
    <>
      <CabeceraAdmin email={admin.email} expira={admin.expira} activa="pedidos" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Panel de pedidos</h1>

        {/* Resumen de ventas */}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de ventas">
          {[
            { t: "Por revisar", v: String(conteo("pendiente")), destacado: conteo("pendiente") > 0 },
            { t: "Ventas aprobadas", v: String(aprobados.length) },
            { t: "Ingresos", v: [sumar("DOP") && formatoDOP(sumar("DOP")), sumar("USD") && formatoUSD(sumar("USD"))].filter(Boolean).join(" + ") || "—" },
            { t: "Alumnos con acceso", v: String(alumnosActivos) },
          ].map((c) => (
            <div key={c.t} className={`tarjeta p-4 ${c.destacado ? "border-amber-400/50 bg-amber-400/5" : ""}`}>
              <div className="text-xs tracking-wider text-suave uppercase">{c.t}</div>
              <div className="mt-1 font-display text-xl font-bold sm:text-2xl">{c.v}</div>
            </div>
          ))}
        </section>

        {/* Filtros */}
        <nav className="mt-8 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar pedidos">
          {FILTROS.map((f) => (
            <Link
              key={f.valor}
              href={`/admin?estado=${f.valor}`}
              aria-current={estado === f.valor ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                estado === f.valor ? "border-marca bg-marca/15 font-semibold" : "border-borde text-suave hover:text-texto"
              }`}
            >
              {f.texto} <span className="ml-1 text-xs opacity-70">{conteo(f.valor)}</span>
            </Link>
          ))}
        </nav>

        <p className="mt-3 text-sm text-suave">{AYUDA[estado]}</p>

        <section className="mt-4 space-y-2">
          {visibles.length === 0 ? (
            <p className="tarjeta p-8 text-center text-suave">
              {estado === "pendiente" ? "🎉 No hay pagos por revisar. ¡Todo al día!" : "No hay pedidos en esta lista."}
            </p>
          ) : (
            visibles.map((p) => <TarjetaPedido key={p.id} p={p} recienAprobado={p.id === nuevo} />)
          )}
        </section>
      </main>
    </>
  );
}
