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

/** Validación rápida en el navegador (el servidor vuelve a validar todo). */
export function faltanDatos(d: DatosCliente) {
  if (d.nombre.trim().length < 2) return "Escribe tu nombre en el paso 1.";
  if (d.apellido.trim().length < 2) return "Escribe tu apellido en el paso 1.";
  if (d.telefono.replace(/\D/g, "").length < 10) return "Escribe tu teléfono (10 dígitos) en el paso 1.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return "Escribe un correo válido en el paso 1.";
  return null;
}
