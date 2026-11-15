/**
 * Comprueba que el servidor puede usar Firestore, Storage y Auth del proyecto real.
 * Uso: npm run probar-conexion
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_STORAGE_BUCKET: storageBucket } = process.env;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId, storageBucket });

const ok = (t) => console.log(`✅ ${t}`);
const mal = (t, e) => {
  console.log(`❌ ${t}: ${e.message}`);
  process.exitCode = 1;
};

try {
  const ref = getFirestore().collection("_prueba").doc("conexion");
  await ref.set({ hora: FieldValue.serverTimestamp() });
  await ref.get();
  await ref.delete();
  ok("Firestore: escribir, leer y borrar");
} catch (e) {
  mal("Firestore", e);
}

try {
  const f = getStorage().bucket().file("_prueba/conexion.txt");
  await f.save("ok", { contentType: "text/plain", resumable: false });
  const [url] = await f.getSignedUrl({ version: "v4", action: "read", expires: Date.now() + 60_000 });
  const res = await fetch(url);
  await f.delete();
  if (!res.ok) throw new Error(`URL firmada respondió ${res.status}`);
  ok("Storage: subir archivo y URL firmada temporal");
} catch (e) {
  mal("Storage", e);
}

try {
  await getAuth().listUsers(1);
  ok("Authentication: acceso de administrador");
} catch (e) {
  mal("Authentication", e);
}
