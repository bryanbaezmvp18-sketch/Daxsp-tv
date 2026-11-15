"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Escucha en tiempo real (onSnapshot) el estado de compra del cliente.
 * Si cambia (p. ej. el admin aprueba), vuelve a pintar la página y se
 * desbloquea el curso sin recargar. Si la escucha no es posible, revisa cada 20 s.
 */
export function EscuchaEstado({ uid, estadoInicial }: { uid: string; estadoInicial: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelar: (() => void) | undefined;
    let intervalo: ReturnType<typeof setInterval> | undefined;
    let vivo = true;

    const respaldo = () => {
      if (intervalo) return;
      intervalo = setInterval(() => document.visibilityState === "visible" && router.refresh(), 20_000);
    };

    (async () => {
      try {
        const [{ clientAuth, clientDb }, { doc, onSnapshot }] = await Promise.all([
          import("@/lib/firebase/client"),
          import("firebase/firestore"),
        ]);
        const auth = clientAuth();
        await auth.authStateReady();
        if (!vivo) return;
        if (auth.currentUser?.uid !== uid) return respaldo(); // sin sesión de Google en este navegador
        cancelar = onSnapshot(
          doc(clientDb(), "usuarios", uid),
          (snap) => {
            if (snap.exists() && snap.get("estadoCompra") !== estadoInicial) router.refresh();
          },
          () => respaldo(), // sin permiso de lectura → revisión periódica
        );
      } catch {
        respaldo();
      }
    })();

    return () => {
      vivo = false;
      cancelar?.();
      if (intervalo) clearInterval(intervalo);
    };
  }, [uid, estadoInicial, router]);

  return null;
}
