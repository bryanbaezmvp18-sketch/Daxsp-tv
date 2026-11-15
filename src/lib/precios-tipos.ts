/** Oferta por tiempo limitado con cronómetro (editable desde Panel → Precios). */
export interface Oferta {
  activa: boolean;
  texto: string; // p. ej. "Precio de lanzamiento por tiempo limitado"
  terminaEn: string | null; // fecha ISO en que termina la oferta
}

/** Precios editables desde el panel (se usan en el navegador y en el servidor). */
export interface Precios {
  usd: number; // lo que cobra PayPal/tarjeta
  usdAntes: number | null; // precio tachado (null = sin descuento)
  dop: number; // precio por transferencia en RD$
  oferta: Oferta;
}

export const descuento = (p: Pick<Precios, "usd" | "usdAntes">) =>
  p.usdAntes && p.usdAntes > p.usd ? Math.round((1 - p.usd / p.usdAntes) * 100) : 0;

/** La oferta se muestra si está activa y su fecha de fin aún no ha pasado. */
export const ofertaVigente = (o: Oferta, ahora = Date.now()) =>
  o.activa && !!o.terminaEn && new Date(o.terminaEn).getTime() > ahora;
