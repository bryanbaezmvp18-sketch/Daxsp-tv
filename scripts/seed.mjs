/**
 * Crea un curso de EJEMPLO: 2 módulos y 3 lecciones (2 videos + 1 PDF)
 * y sube archivos de prueba a Storage en la carpeta privada curso/.
 *
 * Uso:  npm run seed
 *
 * Para tu curso real: sube tus videos/PDF a Storage (carpeta curso/) desde la
 * consola de Firebase y edita los módulos en Firestore (colección "modulos"),
 * o adapta este archivo y vuelve a ejecutarlo.
 */
import { readFile } from "node:fs/promises";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_STORAGE_BUCKET: storageBucket } = process.env;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const emulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
initializeApp(
  emulador && !clientEmail
    ? { projectId, storageBucket }
    : { credential: cert({ projectId, clientEmail, privateKey }), projectId, storageBucket },
);
const db = getFirestore();
const bucket = getStorage().bucket();

// PDF mínimo válido de una página
function pdfDeEjemplo(texto) {
  const contenido = `BT /F1 20 Tf 72 720 Td (${texto}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objs.map((o, i) => {
    const off = pdf.length;
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
    return off;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

const video = await readFile(new URL("../public/video/intro.mp4", import.meta.url));
const archivos = [
  { ruta: "curso/modulo-1/leccion-1.mp4", datos: video, tipo: "video/mp4" },
  { ruta: "curso/modulo-1/guia-nichos.pdf", datos: pdfDeEjemplo("Guia de nichos - Daxsp TV (ejemplo)"), tipo: "application/pdf" },
  { ruta: "curso/modulo-2/leccion-1.mp4", datos: video, tipo: "video/mp4" },
];
for (const a of archivos) {
  await bucket.file(a.ruta).save(a.datos, { contentType: a.tipo, resumable: false });
  console.log(`  ↑ ${a.ruta}`);
}

const modulos = [
  {
    id: "modulo-1",
    titulo: "Módulo 1 · Fundamentos del contenido faceless",
    orden: 1,
    lecciones: [
      { id: "m1-l1", titulo: "Qué es un canal faceless y por qué funciona", tipo: "video", rutaArchivo: "curso/modulo-1/leccion-1.mp4", duracion: "0:37" },
      { id: "m1-l2", titulo: "Guía descargable: cómo elegir tu nicho", tipo: "pdf", rutaArchivo: "curso/modulo-1/guia-nichos.pdf" },
    ],
  },
  {
    id: "modulo-2",
    titulo: "Módulo 2 · Del tema al video terminado",
    orden: 2,
    lecciones: [
      { id: "m2-l1", titulo: "Guiones con hook de 3 segundos", tipo: "video", rutaArchivo: "curso/modulo-2/leccion-1.mp4", duracion: "0:37" },
    ],
  },
];
for (const { id, ...m } of modulos) {
  await db.collection("modulos").doc(id).set(m);
  console.log(`  ✓ ${m.titulo}`);
}
console.log(`✅ Curso de ejemplo creado${emulador ? " (emuladores)" : ""}.`);
process.exit(0);
