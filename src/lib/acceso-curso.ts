import "server-only";
import { clienteActual } from "@/lib/cliente-sesion";
import { alumnoActual } from "@/lib/acceso";

/**
 * ¿Quién puede ver el curso en esta petición?
 * 1. Un cliente con su cuenta de Google y compra APROBADA (lo normal).
 * 2. Compatibilidad: alumnos antiguos que entraron con enlace personal.
 * Devuelve el id con el que se guarda su progreso, o null si no tiene acceso.
 */
export async function lectorCurso(): Promise<{ id: string } | null> {
  const cliente = await clienteActual();
  if (cliente?.estadoCompra === "aprobado") return { id: cliente.uid };
  const alumno = await alumnoActual();
  return alumno ? { id: alumno.id } : null;
}
