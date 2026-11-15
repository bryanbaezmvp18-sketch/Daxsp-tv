/** Datos del comprador (se usa en el navegador y en el servidor). */
export interface DatosCliente {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/** Limpia y valida. Devuelve los datos o la lista de errores. */
export function validarCliente(b: Record<string, unknown>): { datos: DatosCliente } | { errores: string[] } {
  const datos: DatosCliente = {
    nombre: texto(b.nombre, 50),
    apellido: texto(b.apellido, 50),
    email: texto(b.email, 120).toLowerCase(),
    telefono: texto(b.telefono, 20).replace(/[^\d+]/g, ""),
  };
  const errores: string[] = [];
  if (datos.nombre.length < 2) errores.push("Escribe tu nombre.");
  if (datos.apellido.length < 2) errores.push("Escribe tu apellido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.email)) errores.push("El correo no es válido.");
  if (datos.telefono.replace(/\D/g, "").length < 10) errores.push("El teléfono debe tener al menos 10 dígitos.");
  return errores.length ? { errores } : { datos };
}

export const nombreCompleto = (d: Pick<DatosCliente, "nombre" | "apellido">) => `${d.nombre} ${d.apellido}`.trim();
