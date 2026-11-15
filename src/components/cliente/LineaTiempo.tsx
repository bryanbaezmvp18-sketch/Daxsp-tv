import type { EstadoCompra } from "@/lib/cliente-sesion";

/** Tiempo entre un paso y el siguiente al «cargarse» la línea (segundos). */
const PASO_S = 0.5;

/**
 * Registrado → Pago enviado → En revisión → Aprobado (o Rechazado / Acceso retirado).
 * Al abrir la página la línea se va llenando en verde, paso a paso.
 */
export function LineaTiempo({ estado }: { estado: EstadoCompra }) {
  const retirado = estado === "retirado";
  const rechazado = estado === "rechazado" || retirado;
  const pasos = [
    "Registrado",
    "Pago enviado",
    rechazado ? "Revisado" : "En revisión",
    retirado ? "Acceso retirado" : rechazado ? "Rechazado" : "Aprobado",
  ];
  // Índice del paso actual
  const actual = { sin_compra: 0, pendiente: 2, aprobado: 3, rechazado: 3, retirado: 3 }[estado];

  /** Color de cada paso ya alcanzado: verde, salvo el paso actual en revisión (ámbar) o rechazado (rojo). */
  const colorPaso = (i: number) =>
    rechazado && i === 3 ? "bg-red-400" : estado === "pendiente" && i === actual ? "bg-amber-400" : "bg-emerald-400";

  /** Tramo de línea: carril gris + relleno que se carga de izquierda a derecha. */
  const Tramo = ({ lleno, retraso, color, oculto }: { lleno: boolean; retraso: number; color: string; oculto?: boolean }) => (
    <span className={`relative h-1 flex-1 overflow-hidden rounded-full bg-white/10 ${oculto ? "opacity-0" : ""}`}>
      {lleno && (
        <span
          className={`linea-carga absolute inset-0 rounded-full ${color}`}
          style={{ animationDelay: `${retraso}s` }}
        />
      )}
    </span>
  );

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Estado de tu compra">
      {pasos.map((t, i) => {
        const alcanzado = i <= actual;
        const esActual = i === actual;
        const color = colorPaso(i);
        const tCirculo = i * PASO_S;
        return (
          <li key={t} aria-current={esActual ? "step" : undefined} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              {/* Llega al círculo justo antes de que se encienda */}
              <Tramo lleno={alcanzado} retraso={Math.max(0, tCirculo - PASO_S / 2)} color={color} oculto={i === 0} />
              <span
                className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  alcanzado ? "border-transparent" : "border-borde text-suave"
                }`}
              >
                {alcanzado && (
                  <span
                    aria-hidden
                    className={`paso-carga absolute inset-0 rounded-full ${color} ${esActual && estado === "pendiente" ? "animate-pulse" : ""}`}
                    style={{ animationDelay: `${tCirculo}s` }}
                  />
                )}
                <span
                  className={`relative ${alcanzado ? "paso-carga text-black" : ""}`}
                  style={alcanzado ? { animationDelay: `${tCirculo}s` } : undefined}
                >
                  {rechazado && i === 3 ? "✕" : alcanzado ? "✓" : i + 1}
                </span>
              </span>
              {/* Sale del círculo hacia el siguiente paso (solo si ya se llegó a él) */}
              <Tramo lleno={i < actual} retraso={tCirculo + 0.1} color={colorPaso(i + 1)} oculto={i === pasos.length - 1} />
            </div>
            <span
              className={`mt-2 text-[11px] leading-tight sm:text-xs ${alcanzado ? "paso-texto text-texto" : "text-suave"}`}
              style={alcanzado ? { animationDelay: `${tCirculo}s` } : undefined}
            >
              {t}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
