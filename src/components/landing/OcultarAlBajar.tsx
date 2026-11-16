"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Barra fija que se esconde al deslizar hacia abajo y vuelve a aparecer al
 * deslizar hacia arriba (o al llegar arriba del todo).
 */
export function OcultarAlBajar({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const [oculta, setOculta] = useState(false);
  const ultimaY = useRef(0);

  useEffect(() => {
    ultimaY.current = window.scrollY;
    let pendiente = false;
    const revisar = () => {
      pendiente = false;
      const y = window.scrollY;
      const delta = y - ultimaY.current;
      if (y < 80) setOculta(false); // arriba del todo: siempre visible
      else if (delta > 6) setOculta(true); // bajando
      else if (delta < -6) setOculta(false); // subiendo
      if (Math.abs(delta) > 6 || y < 80) ultimaY.current = y;
    };
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(revisar);
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  return (
    <div className={`${className} transition-transform duration-300 ease-out ${oculta ? "translate-y-[calc(100%+1rem)]" : "translate-y-0"}`}>
      {children}
    </div>
  );
}
