/** Teléfono ilustrado (solo CSS, sin imágenes) que muestra un video en producción. */
const pasos = ["Investigando el tema", "Escribiendo el guion", "Generando la voz", "Editando y subtitulando"];

export function MockupTelefono() {
  return (
    <div className="relative mx-auto w-full max-w-[210px] sm:max-w-[250px] lg:max-w-[300px]" aria-hidden>
      <div className="absolute -inset-6 rounded-[3rem] bg-linear-to-br from-marca-2/30 via-marca/30 to-acento/30 blur-2xl" />
      <div className="relative rounded-[2.6rem] border border-white/10 bg-[#0c0b14] p-2.5 shadow-2xl">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] bg-linear-to-b from-[#1b1530] via-[#120f22] to-[#0a0912]">
          <div className="absolute top-2 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* "Video" */}
          <div className="absolute inset-x-4 top-12 bottom-40 overflow-hidden rounded-2xl bg-linear-to-br from-marca/50 via-acento/30 to-marca-2/40">
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20 backdrop-blur">
                <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
              </div>
            </div>
            <p className="absolute inset-x-3 bottom-4 text-center font-display text-sm font-bold text-white drop-shadow">
              ¿Por qué soñamos <span className="text-marca-2">lo que soñamos</span>?
            </p>
          </div>

          {/* Progreso */}
          <ul className="absolute inset-x-4 bottom-6 space-y-2 text-[11px]">
            {pasos.map((p, i) => (
              <li key={p} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-suave">
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] ${
                    i < 3 ? "bg-marca-2 text-black" : "animate-pulse border border-marca"
                  }`}
                >
                  {i < 3 ? "✓" : ""}
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Insignias flotantes */}
      <div className="tarjeta absolute top-16 -left-10 hidden px-3 py-2 text-xs sm:block">
        <b className="text-marca-2">1080×1920</b> listo
      </div>
      <div className="tarjeta absolute -right-8 bottom-28 hidden px-3 py-2 text-xs sm:block">
        ❤️ <b>12.4K</b> likes
      </div>
    </div>
  );
}
