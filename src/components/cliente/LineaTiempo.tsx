import type { EstadoCompra } from "@/lib/cliente-sesion";

/** Registrado → Pago enviado → En revisión → Aprobado (o Rechazado). */
export function LineaTiempo({ estado }: { estado: EstadoCompra }) {
  const rechazado = estado === "rechazado";
  const pasos = ["Registrado", "Pago enviado", rechazado ? "Revisado" : "En revisión", rechazado ? "Rechazado" : "Aprobado"];
  // Índice del paso actual
  const actual = { sin_compra: 0, pendiente: 2, aprobado: 3, rechazado: 3 }[estado];

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Estado de tu compra">
      {pasos.map((t, i) => {
        const hecho = i < actual || (i === actual && estado === "aprobado") || (i === 0);
        const esActual = i === actual;
        const color = rechazado && i === 3 ? "bg-red-400" : estado === "pendiente" && esActual ? "bg-amber-400" : "bg-linear-to-r from-marca-2 to-marca";
        return (
          <li key={t} aria-current={esActual ? "step" : undefined} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-1 flex-1 rounded-full ${i === 0 ? "opacity-0" : i <= actual ? color : "bg-white/10"}`} />
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  i <= actual ? `${color} text-black` : "border border-borde text-suave"
                } ${esActual && estado === "pendiente" ? "animate-pulse" : ""}`}
              >
                {rechazado && i === 3 ? "✕" : hecho || i < actual ? "✓" : i + 1}
              </span>
              <span className={`h-1 flex-1 rounded-full ${i === pasos.length - 1 ? "opacity-0" : i < actual ? color : "bg-white/10"}`} />
            </div>
            <span className={`mt-2 text-[11px] leading-tight sm:text-xs ${i <= actual ? "text-texto" : "text-suave"}`}>{t}</span>
          </li>
        );
      })}
    </ol>
  );
}
