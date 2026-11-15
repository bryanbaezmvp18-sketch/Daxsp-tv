"use client";

import { useEffect, useState } from "react";

const dos = (n: number) => String(n).padStart(2, "0");

function partes(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Segundos que faltan, actualizados cada segundo (null antes de montar, para no desajustar la hidratación). */
export function useRestante(fin: string | null) {
  const [restante, setRestante] = useState<number | null>(null);
  useEffect(() => {
    if (!fin) return;
    const t = new Date(fin).getTime();
    const tick = () => setRestante(t - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fin]);
  return restante;
}

/** Muestra su contenido solo mientras la oferta no haya terminado (se oculta solo al llegar a cero). */
export function SiVigente({ fin, children }: { fin: string | null; children: React.ReactNode }) {
  const restante = useRestante(fin);
  if (!fin || (restante !== null && restante <= 0)) return null;
  return <>{children}</>;
}

/**
 * Cronómetro de la oferta.
 * - "linea": compacto, para la barra superior.
 * - "cajas": días/horas/minutos/segundos en cajas, para la tarjeta de precio.
 */
export function Cronometro({ fin, variante = "cajas", alTerminar }: { fin: string | null; variante?: "linea" | "cajas"; alTerminar?: React.ReactNode }) {
  const restante = useRestante(fin);
  if (!fin) return null;
  if (restante !== null && restante <= 0) return <>{alTerminar ?? null}</>;
  const t = restante === null ? null : partes(restante);

  if (variante === "linea") {
    return (
      <span className="font-mono tabular-nums" aria-live="off">
        {t ? `${t.d > 0 ? `${t.d}d ` : ""}${dos(t.h)}:${dos(t.m)}:${dos(t.s)}` : "--:--:--"}
      </span>
    );
  }

  const cajas = [
    { v: t?.d, e: "días" },
    { v: t?.h, e: "horas" },
    { v: t?.m, e: "min" },
    { v: t?.s, e: "seg" },
  ];
  return (
    <div className="flex justify-center gap-2" role="timer" aria-label="Tiempo restante de la oferta">
      {cajas.map((c, i) => (
        <div key={c.e} className="flex items-center gap-2">
          <div className="min-w-14 rounded-xl border border-acento/30 bg-acento/10 px-2 py-2 text-center">
            <div className="font-display text-2xl font-bold tabular-nums">{c.v === undefined ? "--" : dos(c.v)}</div>
            <div className="text-[10px] tracking-wider text-suave uppercase">{c.e}</div>
          </div>
          {i < cajas.length - 1 && <span className="font-display text-xl font-bold text-acento/60">:</span>}
        </div>
      ))}
    </div>
  );
}
