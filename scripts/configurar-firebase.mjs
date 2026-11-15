/**
 * Copia las credenciales del Admin SDK desde el JSON de la cuenta de servicio
 * a .env.local, sin mostrarlas en pantalla.
 *
 * Uso:  npm run configurar-firebase -- service-account.json
 * (el JSON se descarga en Firebase → Configuración del proyecto →
 *  Cuentas de servicio → Generar nueva clave privada)
 */
import { readFile, writeFile } from "node:fs/promises";

const ruta = process.argv[2];
if (!ruta) {
  console.error("Uso: npm run configurar-firebase -- ruta/al/archivo.json");
  process.exit(1);
}
const sa = JSON.parse(await readFile(ruta, "utf8"));
if (!sa.client_email || !sa.private_key || !sa.project_id) {
  console.error("Ese archivo no parece una clave de cuenta de servicio de Firebase.");
  process.exit(1);
}

let env = await readFile(".env.local", "utf8").catch(() => "");
const poner = (clave, valor) => {
  const linea = `${clave}=${valor}`;
  const re = new RegExp(`^${clave}=.*$`, "m");
  env = re.test(env) ? env.replace(re, () => linea) : `${env.trimEnd()}\n${linea}\n`;
};
poner("FIREBASE_PROJECT_ID", sa.project_id);
poner("FIREBASE_CLIENT_EMAIL", sa.client_email);
poner("FIREBASE_PRIVATE_KEY", JSON.stringify(sa.private_key)); // queda entre comillas con \n
await writeFile(".env.local", env);

console.log(`✅ Credenciales del proyecto "${sa.project_id}" guardadas en .env.local`);
console.log("   Ahora puedes borrar el archivo JSON o guardarlo en un lugar seguro (no lo subas a git).");
