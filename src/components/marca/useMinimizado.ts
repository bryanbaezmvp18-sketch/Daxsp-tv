"use client";

import { useEffect, useRef, useState } from "react";

/**
 * true mientras se desliza hacia abajo; false al subir o cerca de arriba.
 *
 * Anti-temblor: al achicarse o agrandarse la cabecera, el contenido de abajo se
 * mueve y el navegador lo registra como «desplazamiento». Para no entrar en un
 * bucle (achica → se mueve → agranda → …):
 *  - después de cada cambio se ignoran los movimientos durante la animación,
 *  - y hace falta acumular un recorrido mínimo en una dirección para cambiar.
 */
export function useMinimizado(umbral = 120) {
  const [minimizado, setMinimizado] = useState(false);
  const estado = useRef(false);
  const ultimaY = useRef(0);
  const acumulado = useRef(0);
  const bloqueadoHasta = useRef(0);

  useEffect(() => {
    ultimaY.current = window.scrollY;
    let pendiente = false;

    const cambiar = (v: boolean) => {
      if (estado.current === v) return;
      estado.current = v;
      setMinimizado(v);
      acumulado.current = 0;
      bloqueadoHasta.current = performance.now() + 450; // dura la animación (300 ms) + margen
    };

    const revisar = () => {
      pendiente = false;
      const y = window.scrollY;
      const delta = y - ultimaY.current;
      ultimaY.current = y;

      if (performance.now() < bloqueadoHasta.current) return; // el salto lo causó la propia animación
      if (y < umbral) return cambiar(false);

      // Acumula en la misma dirección; si cambia de dirección, empieza de cero
      acumulado.current = Math.sign(delta) === Math.sign(acumulado.current) ? acumulado.current + delta : delta;
      if (acumulado.current > 24) cambiar(true); // bajando de verdad
      else if (acumulado.current < -24) cambiar(false); // subiendo de verdad
    };

    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(revisar);
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, [umbral]);

  return minimizado;
}
