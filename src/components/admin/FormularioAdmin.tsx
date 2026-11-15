"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { crearSesion, mensajeError } from "@/lib/auth-cliente";

const CLAVE_CORREO = "daxsp-admin-correo";

export function FormularioAdmin({ caducada = false }: { caducada?: boolean }) {
  const router = useRouter();
  const correoRef = useRef<HTMLInputElement>(null);
  const claveRef = useRef<HTMLInputElement>(null);
  const [recordar, setRecordar] = useState(true);

  // Correo recordado en este dispositivo: solo hay que escribir la contraseña
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_CORREO);
      if (guardado && correoRef.current) {
        correoRef.current.value = guardado;
        claveRef.current?.focus();
      }
    } catch {}
  }, []);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);

  async function firebase() {
    const [{ clientAuth }, authMod] = await Promise.all([import("@/lib/firebase/client"), import("firebase/auth")]);
    const auth = clientAuth();
    auth.languageCode = "es";
    return { auth, ...authMod };
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    setAviso("");
    setCargando(true);
    try {
      const { auth, signInWithEmailAndPassword, signOut } = await firebase();
      const correo = String(f.get("email")).trim();
      const { user } = await signInWithEmailAndPassword(auth, correo, String(f.get("password")));
      try {
        if (recordar) localStorage.setItem(CLAVE_CORREO, correo);
        else localStorage.removeItem(CLAVE_CORREO);
      } catch {}
      try {
        await crearSesion(user);
      } finally {
        await signOut(auth); // la sesión vive en la cookie del servidor
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(mensajeError(err));
      setCargando(false);
    }
  }

  async function olvide() {
    const email = correoRef.current?.value.trim() ?? "";
    setError("");
    setAviso("");
    if (!email) return setError("Escribe tu correo arriba y vuelve a pulsar «¿Olvidaste tu contraseña?».");
    try {
      const { auth, sendPasswordResetEmail } = await firebase();
      await sendPasswordResetEmail(auth, email, { url: `${location.origin}/admin/login` });
    } catch {
      /* No revelamos si el correo existe o no */
    }
    setAviso("Si ese correo es de un administrador, te llegará un mensaje para crear una contraseña nueva. Revisa también spam.");
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {caducada && (
        <p className="rounded-lg border border-marca-2/30 bg-marca-2/10 px-3 py-2 text-sm text-marca-2">
          🔒 Por seguridad, la sesión se cierra cada 5 horas. Vuelve a entrar.
        </p>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Correo</span>
        <input
          ref={correoRef}
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-xl border border-borde bg-fondo px-4 py-3 outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Contraseña</span>
        <input
          ref={claveRef}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-borde bg-fondo px-4 py-3 outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-suave">
          <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="h-4 w-4 accent-[var(--color-marca)]" />
          Recordar mi correo en este dispositivo
        </label>
        <button type="button" onClick={olvide} className="text-sm text-marca-2 hover:underline">
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      <p className="text-xs text-suave">Tu sesión se mantiene aunque cierres el navegador y se cierra sola a las 5 horas.</p>
      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {aviso && <p role="status" className="rounded-lg border border-marca-2/30 bg-marca-2/10 px-3 py-2 text-sm text-marca-2">{aviso}</p>}
      <button disabled={cargando} className="btn-primario w-full disabled:opacity-60">
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
