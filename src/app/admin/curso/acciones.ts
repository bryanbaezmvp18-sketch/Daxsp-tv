"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminBucket, adminDb } from "@/lib/firebase/admin";
import { requerirAdmin } from "@/lib/sesion";
import { urlTemporal } from "@/lib/archivos";
import {
  EXT_TEXTO,
  MAX_BYTES_MATERIAL,
  MIME_POR_EXT,
  SECCIONES_MATERIAL,
  extension,
  type TipoMaterial,
} from "@/lib/materiales-tipos";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const PREFIJO = "curso/materiales/";
const TIPOS = SECCIONES_MATERIAL.map((s) => s.tipo);
const ORDEN_TIPO: Record<TipoMaterial, number> = { guia: 0, kit: 1, plantilla: 2, video: 3, documento: 4 };

const idValido = (id: string) => /^[a-z0-9.-]{1,100}$/.test(id);
const rutaValida = (r: string) => r.startsWith(PREFIJO) && /^curso\/materiales\/[a-z0-9.-]{3,140}$/.test(r);
const limpiar = (v: unknown, max: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function refrescar() {
  revalidatePath("/admin/curso");
  revalidatePath("/mi-cuenta");
}

/**
 * Paso 1 de una subida: reserva la ruta privada en Storage y entrega un pase
 * de un solo uso para que el navegador del admin suba el archivo directo a
 * Firebase (así no pasa por el servidor y no hay límite de 4 MB de Vercel).
 */
export async function prepararSubida(nombre: string, bytes: number): Promise<Resultado<{ ruta: string; pase: string; contentType: string }>> {
  const admin = await requerirAdmin();
  nombre = limpiar(nombre, 150);
  if (!nombre) return { ok: false, error: "El archivo no tiene nombre." };
  if (!Number.isFinite(bytes) || bytes <= 0) return { ok: false, error: "El archivo está vacío." };
  if (bytes > MAX_BYTES_MATERIAL) return { ok: false, error: "El archivo pesa más de 1 GB. Comprímelo o súbelo dividido." };

  const ext = extension(nombre);
  const base = slug(nombre.replace(/\.[^.]+$/, "")) || "archivo";
  const ruta = `${PREFIJO}${Date.now().toString(36)}-${base}${slug(ext)}`;
  // Pase temporal con permiso de admin (las reglas de Storage solo dejan escribir a admins)
  const pase = await adminAuth().createCustomToken(admin.uid, { admin: true });
  return { ok: true, ruta, pase, contentType: MIME_POR_EXT[ext] ?? "application/octet-stream" };
}

/** Lee del bucket el archivo recién subido (comprueba que existe y su tamaño real). */
async function datosDelArchivo(ruta: string) {
  const archivo = adminBucket().file(ruta);
  const [existe] = await archivo.exists();
  if (!existe) throw new Error("No encuentro el archivo subido. Vuelve a intentarlo.");
  const [meta] = await archivo.getMetadata();
  return { bytes: Number(meta.size ?? 0) };
}

export interface DatosMaterial {
  titulo: string;
  descripcion: string;
  tipo: TipoMaterial;
}

function validarDatos(d: DatosMaterial): { datos: DatosMaterial } | { error: string } {
  const datos = { titulo: limpiar(d.titulo, 120), descripcion: limpiar(d.descripcion, 300), tipo: d.tipo };
  if (datos.titulo.length < 2) return { error: "Escribe un título para el archivo." };
  if (!TIPOS.includes(datos.tipo)) return { error: "Elige una sección." };
  return { datos };
}

/** Paso 2: registra en el curso un archivo ya subido. */
export async function guardarMaterialNuevo(ruta: string, nombreArchivo: string, d: DatosMaterial): Promise<Resultado<{ id: string }>> {
  await requerirAdmin();
  if (!rutaValida(ruta)) return { ok: false, error: "Ruta de archivo inválida." };
  const v = validarDatos(d);
  if ("error" in v) return { ok: false, error: v.error };
  const archivo = limpiar(nombreArchivo, 150);

  try {
    const { bytes } = await datosDelArchivo(ruta);
    const db = adminDb();
    // Al final de su sección
    const mismos = await db.collection("materiales").where("tipo", "==", v.datos.tipo).get();
    const maxOrden = Math.max(ORDEN_TIPO[v.datos.tipo] * 1000 - 1, ...mismos.docs.map((x) => Number(x.get("orden") ?? 0)));
    const id = `${slug(archivo.replace(/\.[^.]+$/, "")).slice(0, 60) || "archivo"}-${randomBytes(3).toString("hex")}`;

    await db.collection("materiales").doc(id).set({
      ...v.datos,
      archivo,
      carpeta: "",
      esTexto: EXT_TEXTO.includes(extension(archivo)),
      rutaArchivo: ruta,
      bytes,
      orden: maxOrden + 1,
      actualizadoEn: FieldValue.serverTimestamp(),
    });
    refrescar();
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar el archivo." };
  }
}

/** Cambia título, descripción o sección. */
export async function editarMaterial(id: string, d: DatosMaterial): Promise<Resultado> {
  await requerirAdmin();
  if (!idValido(id)) return { ok: false, error: "Archivo inválido." };
  const v = validarDatos(d);
  if ("error" in v) return { ok: false, error: v.error };
  const ref = adminDb().collection("materiales").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return { ok: false, error: "Ese archivo ya no existe." };

  const cambios: Record<string, unknown> = { ...v.datos, actualizadoEn: FieldValue.serverTimestamp() };
  if (doc.get("tipo") !== v.datos.tipo) {
    // Si cambia de sección, pasa al final de la nueva
    const mismos = await adminDb().collection("materiales").where("tipo", "==", v.datos.tipo).get();
    cambios.orden = Math.max(ORDEN_TIPO[v.datos.tipo] * 1000 - 1, ...mismos.docs.map((x) => Number(x.get("orden") ?? 0))) + 1;
  }
  await ref.update(cambios);
  refrescar();
  return { ok: true };
}

/** Cambia el archivo de un material ya existente (mantiene título, sección y posición). */
export async function reemplazarArchivo(id: string, ruta: string, nombreArchivo: string): Promise<Resultado> {
  await requerirAdmin();
  if (!idValido(id) || !rutaValida(ruta)) return { ok: false, error: "Datos inválidos." };
  const ref = adminDb().collection("materiales").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return { ok: false, error: "Ese archivo ya no existe." };
  const archivo = limpiar(nombreArchivo, 150);

  try {
    const { bytes } = await datosDelArchivo(ruta);
    const anterior = doc.get("rutaArchivo") as string | undefined;
    await ref.update({
      archivo,
      rutaArchivo: ruta,
      bytes,
      esTexto: EXT_TEXTO.includes(extension(archivo)),
      actualizadoEn: FieldValue.serverTimestamp(),
    });
    if (anterior && anterior !== ruta && anterior.startsWith(PREFIJO)) await adminBucket().file(anterior).delete().catch(() => {});
    refrescar();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo reemplazar el archivo." };
  }
}

/** Sube o baja un archivo dentro de su sección. */
export async function moverMaterial(id: string, direccion: "arriba" | "abajo"): Promise<Resultado> {
  await requerirAdmin();
  if (!idValido(id)) return { ok: false, error: "Archivo inválido." };
  const db = adminDb();
  const doc = await db.collection("materiales").doc(id).get();
  if (!doc.exists) return { ok: false, error: "Ese archivo ya no existe." };

  const lista = (await db.collection("materiales").where("tipo", "==", doc.get("tipo")).get()).docs.sort(
    (a, b) => Number(a.get("orden") ?? 0) - Number(b.get("orden") ?? 0),
  );
  const i = lista.findIndex((x) => x.id === id);
  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true }; // ya está en el borde

  // Reasigna órdenes consecutivos con el intercambio hecho (evita empates)
  [lista[i], lista[j]] = [lista[j], lista[i]];
  const base = ORDEN_TIPO[doc.get("tipo") as TipoMaterial] * 1000;
  const lote = db.batch();
  lista.forEach((x, k) => lote.update(x.ref, { orden: base + k }));
  await lote.commit();
  refrescar();
  return { ok: true };
}

/** Quita el archivo del curso y lo borra de Storage. */
export async function eliminarMaterial(id: string): Promise<Resultado> {
  await requerirAdmin();
  if (!idValido(id)) return { ok: false, error: "Archivo inválido." };
  const ref = adminDb().collection("materiales").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return { ok: true };
  const ruta = doc.get("rutaArchivo") as string | undefined;
  await ref.delete();
  if (ruta?.startsWith(PREFIJO)) await adminBucket().file(ruta).delete().catch(() => {});
  refrescar();
  return { ok: true };
}

/** Si una subida se cancela o falla al registrarse, borra el archivo huérfano. */
export async function descartarSubida(ruta: string): Promise<Resultado> {
  await requerirAdmin();
  if (!rutaValida(ruta)) return { ok: false, error: "Ruta inválida." };
  const usada = await adminDb().collection("materiales").where("rutaArchivo", "==", ruta).limit(1).get();
  if (usada.empty) await adminBucket().file(ruta).delete().catch(() => {});
  return { ok: true };
}

/** URL temporal (15 min) para que el admin vea o descargue el archivo. */
export async function verMaterial(id: string): Promise<Resultado<{ url: string }>> {
  await requerirAdmin();
  if (!idValido(id)) return { ok: false, error: "Archivo inválido." };
  const doc = await adminDb().collection("materiales").doc(id).get();
  if (!doc.exists) return { ok: false, error: "Ese archivo ya no existe." };
  const url = await urlTemporal(doc.get("rutaArchivo") as string, {
    descargar: doc.get("tipo") === "video" ? undefined : (doc.get("archivo") as string),
  });
  return { ok: true, url };
}
