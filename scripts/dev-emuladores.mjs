/**
 * Arranca la web apuntando a los EMULADORES locales (no toca tu Firebase real).
 * Antes ejecuta en otra terminal:  npm run emuladores
 * Uso: npm run dev:emuladores
 */
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  NEXT_DIST_DIR: ".next-emuladores",
  NEXT_PUBLIC_USE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-daxsp",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-daxsp.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-daxsp.appspot.com",
  FIREBASE_PROJECT_ID: "demo-daxsp",
  FIREBASE_STORAGE_BUCKET: "demo-daxsp.appspot.com",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199",
};
spawn("npx", ["next", "dev", ...process.argv.slice(2)], { env, stdio: "inherit", shell: true });
