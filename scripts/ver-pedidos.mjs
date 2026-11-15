/**
 * Muestra los últimos pedidos guardados en Firestore (útil para comprobar).
 * Uso: npm run ver-pedidos
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_STORAGE_BUCKET: storageBucket } = process.env;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId, storageBucket });

const snap = await getFirestore().collection("pedidos").orderBy("creadoEn", "desc").limit(10).get();
if (snap.empty) console.log("No hay pedidos.");
for (const d of snap.docs) {
  const p = d.data();
  const fotos = p.comprobantes ?? [];
  const existen = await Promise.all(fotos.map((r) => getStorage().bucket().file(r).exists().then(([e]) => e)));
  console.log(
    `• ${d.id.slice(0, 8)}… | ${p.estado} | ${p.metodo} | ${p.nombre} | ${p.moneda} ${p.monto} | pagó a: ${p.bancoDestino ?? "-"} | fotos en Storage: ${existen.filter(Boolean).length}/${fotos.length}`,
  );
}
