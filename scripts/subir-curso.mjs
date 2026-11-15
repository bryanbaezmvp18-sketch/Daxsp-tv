/**
 * Sube los archivos de la carpeta "arvhivos curso" al curso (Storage privado)
 * y crea el menú de materiales que ven los alumnos.
 *
 * Uso:  npm run subir-curso
 *       npm run subir-curso -- "otra carpeta"
 *
 * - Cada archivo de la carpeta (y subcarpetas) aparece en "Mi curso".
 * - Si cambias un archivo, vuelve a ejecutarlo y se actualiza.
 * - Si borras un archivo de la carpeta, desaparece del curso.
 *
 * Tipos (se detectan solos por el nombre o la extensión):
 *   guía        → .txt .md .pdf .docx cuyo nombre tenga "leeme", "guia", "instrucciones" o "pasos"
 *   kit         → .zip  (se descarga tal cual)
 *   plantilla   → .txt .md .js .py .json .html  (se puede leer y copiar desde la web)
 *   video       → .mp4 .mov .webm
 *   documento   → .pdf .docx y cualquier otro
 *
 * Títulos bonitos (opcional): crea en la carpeta un archivo "titulos.json":
 *   { "nombre-del-archivo.zip": { "titulo": "Mi título", "descripcion": "Texto corto" } }
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, extname, basename, sep } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const carpeta = process.argv[2] ?? "arvhivos curso";
const PREFIJO = "curso/materiales/";

const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_STORAGE_BUCKET: storageBucket } = process.env;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
initializeApp(
  process.env.FIRESTORE_EMULATOR_HOST
    ? { projectId, storageBucket }
    : { credential: cert({ projectId, clientEmail, privateKey }), projectId, storageBucket },
);
const db = getFirestore();
const bucket = getStorage().bucket();

const MIME = {
  ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".py": "text/x-python; charset=utf-8", ".json": "application/json", ".html": "text/html; charset=utf-8",
  ".pdf": "application/pdf", ".zip": "application/zip", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".png": "image/png", ".jpg": "image/jpeg",
};
const TEXTO = new Set([".txt", ".md", ".js", ".py", ".json", ".html"]);

function tipoDe(nombre, ext) {
  const n = nombre.toLowerCase();
  if ([".txt", ".md", ".pdf", ".docx"].includes(ext) && /leeme|l[eé]eme|gu[ií]a|instrucciones|pasos|readme/.test(n)) return "guia";
  if (ext === ".zip") return "kit";
  if (TEXTO.has(ext)) return "plantilla";
  if ([".mp4", ".mov", ".webm"].includes(ext)) return "video";
  return "documento";
}

const DESCRIPCION = {
  guia: "Léelo primero: instalación y uso paso a paso.",
  kit: "Súbelo a Claude tal cual, sin descomprimirlo.",
  plantilla: "Cópialo y pégalo en Claude.",
  video: "Míralo en línea.",
  documento: "Descárgalo y guárdalo.",
};
const ORDEN_TIPO = { guia: 0, kit: 1, plantilla: 2, video: 3, documento: 4 };

/** "LEEME - como instalar y usar" → "Leeme - como instalar y usar"; "animacion-2d-pro" → "Animacion 2d pro" */
function tituloDe(nombre) {
  const base = /\s/.test(nombre) ? nombre : nombre.replace(/[-_]+/g, " ");
  const t = base.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

async function listar(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || ["desktop.ini", "Thumbs.db", "titulos.json"].includes(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listar(ruta)));
    else out.push(ruta);
  }
  return out;
}

let archivos;
try {
  archivos = await listar(carpeta);
} catch {
  console.error(`No encuentro la carpeta "${carpeta}".`);
  process.exit(1);
}
if (!archivos.length) {
  console.error(`La carpeta "${carpeta}" está vacía.`);
  process.exit(1);
}

let titulos = {};
try {
  titulos = JSON.parse(await readFile(join(carpeta, "titulos.json"), "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") console.warn(`⚠️ titulos.json tiene un error de formato y se ignorará: ${e.message}`);
}

console.log(`Subiendo ${archivos.length} archivo(s) de "${carpeta}"…\n`);
const vigentes = new Set();

for (const ruta of archivos) {
  const rel = relative(carpeta, ruta).split(sep).join("/");
  const ext = extname(rel).toLowerCase();
  const nombre = basename(rel, ext);
  const id = slug(rel.replace(/\.[^.]+$/, "")) || "archivo";
  const tipo = tipoDe(nombre, ext);
  const destino = `${PREFIJO}${slug(rel)}`;
  const datos = await readFile(ruta);
  const { size } = await stat(ruta);

  await bucket.file(destino).save(datos, { contentType: MIME[ext] ?? "application/octet-stream", resumable: size > 5 * 1024 * 1024 });
  await db.collection("materiales").doc(id).set(
    {
      titulo: titulos[basename(rel)]?.titulo ?? tituloDe(nombre),
      archivo: basename(rel),
      carpeta: rel.includes("/") ? rel.split("/").slice(0, -1).join(" / ") : "",
      tipo,
      esTexto: TEXTO.has(ext),
      descripcion: titulos[basename(rel)]?.descripcion ?? DESCRIPCION[tipo],
      rutaArchivo: destino,
      bytes: size,
      orden: ORDEN_TIPO[tipo] * 1000 + vigentes.size,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  vigentes.add(id);
  console.log(`  ✓ [${tipo}] ${rel}  (${(size / 1024).toFixed(1)} KB)`);
}

// Quitar del curso lo que ya no está en la carpeta
const existentes = await db.collection("materiales").get();
for (const d of existentes.docs) {
  if (vigentes.has(d.id)) continue;
  const ruta = d.get("rutaArchivo");
  if (typeof ruta === "string" && ruta.startsWith(PREFIJO)) await bucket.file(ruta).delete().catch(() => {});
  await d.ref.delete();
  console.log(`  − quitado: ${d.get("archivo")}`);
}

console.log(`\n✅ Curso actualizado: ${vigentes.size} material(es) disponibles para los alumnos.`);
process.exit(0);
