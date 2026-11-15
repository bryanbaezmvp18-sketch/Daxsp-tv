import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * Firebase Admin SDK (solo servidor). Ignora las reglas de seguridad,
 * por eso es el único que puede cambiar tieneAcceso o el estado de un pedido.
 *
 * Con emuladores (FIREBASE_AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST...) no
 * hacen falta credenciales reales.
 */
function app(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // En Vercel la clave suele guardarse con "\n" literales
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId) throw new Error("Falta FIREBASE_PROJECT_ID en .env.local");

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp({ projectId, storageBucket });
  }
  if (!clientEmail || !privateKey) {
    throw new Error("Faltan FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY en .env.local");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId, storageBucket });
}

export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());
export const adminBucket = () => getStorage(app()).bucket();
