"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Vuelve a consultar el estado cada X segundos (solo mientras la pestaña está visible). */
export function ActualizarSolo({ segundos }: { segundos: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);
    return () => clearInterval(id);
  }, [router, segundos]);
  return null;
}
