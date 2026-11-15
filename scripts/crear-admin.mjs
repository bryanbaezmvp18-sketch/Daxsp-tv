/**
 * Crea el PRIMER administrador (los demás se invitan desde el panel /admin/administradores).
 *
 * Uso:
 *   npm run crear-admin -- tu@correo.com "Tu Nombre"
 *
 * - Crea tu usuario en Firebase Authentication (si no existe) SIN contraseña.
 * - Le da el permiso admin=true y lo registra en la colección "administradores".
 * - Muestra un enlace para que TÚ crees tu contraseña (nadie más la ve).
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const [emailArg, ...resto] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();
const nombre = resto.join(" ").trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || nombre.length < 2) {
  console.error('Uso: npm run crear-admin -- tu@correo.com "Tu Nombre"');
  process.exit(1);
}

const { FIREBASE_PROJECT_ID: projectId, FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_AUTH_EMULATOR_HOST } = process.env;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
initializeApp(
  FIREBASE_AUTH_EMULATOR_HOST
    ? { projectId }
    : { credential: cert({ projectId, clientEmail, privateKey }), projectId },
);
const auth = getAuth();
const sitio = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

let usuario;
try {
  usuario = await auth.getUserByEmail(email);
  console.log(`Usuario encontrado: ${email}`);
} catch (e) {
  if (e.code !== "auth/user-not-found") throw e;
  usuario = await auth.createUser({ email, displayName: nombre });
  console.log(`Usuario creado: ${email}`);
}

await auth.setCustomUserClaims(usuario.uid, { ...(usuario.customClaims ?? {}), admin: true });
await auth.revokeRefreshTokens(usuario.uid); // obliga a entrar de nuevo con el permiso
await getFirestore()
  .collection("administradores")
  .doc(usuario.uid)
  .set({ nombre, email, activo: true, agregadoPor: "script inicial", fechaAlta: FieldValue.serverTimestamp() }, { merge: true });

const url = new URL(await auth.generatePasswordResetLink(email, { url: `${sitio}/admin/login` }));
url.searchParams.set("lang", "es"); // página de Firebase en español
const enlace = url.toString();

console.log(`\n✅ ${nombre} (${email}) ahora es administrador.\n`);
console.log("👉 Abre este enlace en tu navegador para crear tu contraseña (caduca en ~1 hora):\n");
console.log(enlace);
console.log(`\nDespués entra al panel: ${sitio}/admin/login\n`);
process.exit(0);
