import type { DatosCliente } from "@/lib/cliente";

export function Campo({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-borde bg-fondo px-4 py-3 text-texto outline-none transition [color-scheme:dark] placeholder:text-suave/50 focus:border-marca focus:ring-2 focus:ring-marca/30"
      />
    </label>
  );
}

/** Qué campo del paso 1 falta (para llevar ahí al cliente y marcarlo). */
export function campoFaltante(d: DatosCliente): "nombre" | "apellido" | "telefono" | null {
  if (d.nombre.trim().length < 2) return "nombre";
  if (d.apellido.trim().length < 2) return "apellido";
  if (d.telefono.replace(/\D/g, "").length < 10) return "telefono";
  return null;
}

/** Lleva al cliente al campo que falta, lo enfoca y lo marca en rojo un momento. */
export function irACampo(campo: string) {
  const el = document.getElementById(`campo-${campo}`) as HTMLInputElement | null;
  if (!el) return document.getElementById("paso-datos")?.scrollIntoView({ behavior: "smooth" });
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus({ preventScroll: true });
  el.classList.add("border-red-400", "ring-2", "ring-red-400/40");
  setTimeout(() => el.classList.remove("border-red-400", "ring-2", "ring-red-400/40"), 3500);
}

/** Validación rápida en el navegador (el servidor vuelve a validar todo). */
export function faltanDatos(d: DatosCliente) {
  if (d.nombre.trim().length < 2) return "Escribe tu nombre en el paso 1.";
  if (d.apellido.trim().length < 2) return "Escribe tu apellido en el paso 1.";
  if (d.telefono.replace(/\D/g, "").length < 10) return "Escribe tu teléfono (10 dígitos) en el paso 1.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return "Escribe un correo válido en el paso 1.";
  return null;
}
