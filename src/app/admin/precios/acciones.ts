"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requerirAdmin } from "@/lib/sesion";
import { ETIQUETA_PRECIOS } from "@/lib/precios";
import type { Precios } from "@/lib/precios-tipos";

type Resultado = { ok: true } | { ok: false; error: string };

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Guarda precios + oferta y actualiza al instante la página principal y el checkout. */
export async function guardarPrecios(entrada: Precios): Promise<Resultado> {
  const admin = await requerirAdmin();
  const usd = redondear(Number(entrada.usd));
  const dop = Math.round(Number(entrada.dop));
  const usdAntes = entrada.usdAntes ? redondear(Number(entrada.usdAntes)) : null;

  if (!Number.isFinite(usd) || usd < 1 || usd > 10_000) return { ok: false, error: "El precio en US$ debe estar entre 1 y 10,000." };
  if (!Number.isFinite(dop) || dop < 50 || dop > 1_000_000) return { ok: false, error: "El precio en RD$ debe estar entre 50 y 1,000,000." };
  if (usdAntes !== null && (!Number.isFinite(usdAntes) || usdAntes <= usd)) {
    return { ok: false, error: "El precio tachado debe ser MAYOR que el precio actual (o déjalo vacío)." };
  }

  const activa = entrada.oferta?.activa === true;
  const texto = String(entrada.oferta?.texto ?? "").trim().slice(0, 80) || "Precio de oferta por tiempo limitado";
  const fin = entrada.oferta?.terminaEn ? new Date(entrada.oferta.terminaEn) : null;
  if (activa) {
    if (!fin || Number.isNaN(fin.getTime())) return { ok: false, error: "Elige la fecha y hora en que termina la oferta." };
    if (fin.getTime() <= Date.now()) return { ok: false, error: "La fecha de fin de la oferta ya pasó. Elige una fecha futura." };
    if (fin.getTime() > Date.now() + 1000 * 60 * 60 * 24 * 365) return { ok: false, error: "La oferta no puede durar más de un año." };
  }

  await adminDb()
    .collection("config")
    .doc("precios")
    .set({
      usd,
      usdAntes,
      dop,
      oferta: { activa, texto, terminaEn: fin && !Number.isNaN(fin.getTime()) ? fin.toISOString() : null },
      actualizadoPor: admin.email,
      actualizadoEn: FieldValue.serverTimestamp(),
    });

  revalidateTag(ETIQUETA_PRECIOS);
  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/admin/precios");
  return { ok: true };
}
