import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { precio as porDefecto, oferta as ofertaPorDefecto } from "@/config/curso";
import type { Oferta, Precios } from "@/lib/precios-tipos";

export const ETIQUETA_PRECIOS = "precios";

function leerOferta(o: Record<string, unknown> | undefined): Oferta {
  if (!o) return { activa: ofertaPorDefecto.activa, texto: ofertaPorDefecto.texto, terminaEn: ofertaPorDefecto.terminaEn };
  return {
    activa: o.activa === true,
    texto: typeof o.texto === "string" && o.texto ? o.texto : ofertaPorDefecto.texto,
    terminaEn: typeof o.terminaEn === "string" ? o.terminaEn : null,
  };
}

/** Lee config/precios. Si aún no existe, usa los valores del archivo de configuración. */
async function leer(): Promise<Precios> {
  try {
    const d = (await adminDb().collection("config").doc("precios").get()).data();
    if (d && Number(d.usd) > 0 && Number(d.dop) > 0) {
      return {
        usd: Number(d.usd),
        usdAntes: d.usdAntes ? Number(d.usdAntes) : null,
        dop: Number(d.dop),
        oferta: leerOferta(d.oferta),
      };
    }
  } catch (e) {
    console.error("No se pudieron leer los precios, uso los de respaldo:", e);
  }
  return { usd: porDefecto.usd, usdAntes: porDefecto.usdAntes ?? null, dop: porDefecto.dop, oferta: leerOferta(undefined) };
}

/**
 * Para mostrar (landing, checkout): con caché, que se borra al instante
 * cuando un administrador guarda precios nuevos.
 */
export const obtenerPrecios = unstable_cache(leer, ["precios"], { tags: [ETIQUETA_PRECIOS], revalidate: 3600 });

/** Para COBRAR: siempre el valor actual, sin caché. */
export const preciosParaCobrar = leer;
