"use client";

import { useConfirmar } from "./Confirmar";

import { useState, useTransition } from "react";
import {
  enlaceNuevoAdministrador,
  invitarAdministrador,
  quitarAdministrador,
} from "@/app/admin/administradores/acciones";
import { BotonCopiar } from "@/components/checkout/BotonCopiar";
import { marca } from "@/config/curso";

export interface AdminVista {
  uid: string;
  nombre: string;
  email: string;
  agregadoPor: string;
  fechaAlta: string;
  soyYo: boolean;
}

const mensajeWhatsApp = (nombre: string, enlace: string) =>
  `Hola ${nombre.split(" ")[0]}, te di acceso como administrador de ${marca.nombre}.\n\n1) Abre este enlace y crea tu contraseña:\n${enlace}\n\n2) Luego entra al panel con tu correo y esa contraseña:\n${location.origin}/admin/login`;

export function GestionAdministradores({ admins }: { admins: AdminVista[] }) {
  const [pendiente, iniciar] = useTransition();
  const confirmar = useConfirmar();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enlace, setEnlace] = useState<{ nombre: string; url: string } | null>(null);
  const [formAbierto, setFormAbierto] = useState(admins.length < 2);

  function invitar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const nombre = String(f.get("nombre"));
    setAviso(null);
    iniciar(async () => {
      const r = await invitarAdministrador(nombre, String(f.get("email")));
      if (!r.ok) return setAviso({ tipo: "error", texto: r.error });
      setAviso({ tipo: "ok", texto: r.mensaje ?? "Listo." });
      if (r.enlace) setEnlace({ nombre, url: r.enlace });
      form.reset();
      setFormAbierto(false);
    });
  }

  function nuevoEnlace(a: AdminVista) {
    setAviso(null);
    iniciar(async () => {
      const r = await enlaceNuevoAdministrador(a.uid);
      if (!r.ok) return setAviso({ tipo: "error", texto: r.error });
      setEnlace({ nombre: a.nombre, url: r.enlace! });
    });
  }

  async function quitar(a: AdminVista) {
    if (!(await confirmar({ titulo: `¿Quitar a ${a.nombre}?`, mensaje: "Ya no podrá entrar al panel.", boton: "Quitar", peligro: true }))) return;
    setAviso(null);
    iniciar(async () => {
      const r = await quitarAdministrador(a.uid);
      setAviso(r.ok ? { tipo: "ok", texto: r.mensaje ?? "Listo." } : { tipo: "error", texto: r.error });
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Lista */}
      <ul className="space-y-3">
        {admins.map((a) => (
          <li key={a.uid} className="tarjeta flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-marca/20 font-bold text-marca-2">
                {a.nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {a.nombre} {a.soyYo && <span className="ml-1 rounded-full bg-marca-2/15 px-2 py-0.5 text-xs text-marca-2">Tú</span>}
                </p>
                <p className="truncate text-sm text-suave">{a.email}</p>
                <p className="text-xs text-suave">
                  Desde {a.fechaAlta || "—"}
                  {a.agregadoPor && a.agregadoPor !== a.email ? ` · añadido por ${a.agregadoPor}` : ""}
                </p>
              </div>
            </div>
            {!a.soyYo && (
              <div className="flex shrink-0 gap-2">
                <button onClick={() => nuevoEnlace(a)} disabled={pendiente} className="rounded-full border border-borde px-3 py-1.5 text-sm text-suave hover:text-texto">
                  Enlace de contraseña
                </button>
                <button onClick={() => quitar(a)} disabled={pendiente} className="rounded-full border border-red-400/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-400/10">
                  Quitar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Enlace para crear contraseña */}
      {enlace && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4">
          <p className="font-semibold text-emerald-300">Envíale este enlace a {enlace.nombre.split(" ")[0]}</p>
          <p className="mt-1 text-sm text-suave">
            Con él crea su propia contraseña (nadie más la conoce). Caduca en aproximadamente 1 hora; si vence, genera otro.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-2 py-1.5 text-xs">{enlace.url}</code>
            <BotonCopiar valor={enlace.url} />
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(enlace.nombre, enlace.url))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-black"
          >
            Enviar por WhatsApp
          </a>
        </div>
      )}

      {aviso && (
        <p role="status" className={`text-sm ${aviso.tipo === "ok" ? "text-emerald-300" : "text-red-300"}`}>
          {aviso.texto}
        </p>
      )}

      {/* Invitar */}
      {formAbierto ? (
        <form onSubmit={invitar} className="tarjeta space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold">Añadir administrador</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { name: "nombre", label: "Nombre y apellido", type: "text", auto: "name" },
              { name: "email", label: "Correo electrónico", type: "email", auto: "email" },
            ].map((c) => (
              <label key={c.name} className="block">
                <span className="mb-1.5 block text-sm font-medium">{c.label}</span>
                <input
                  name={c.name}
                  type={c.type}
                  required
                  autoComplete="off"
                  className="w-full rounded-xl border border-borde bg-fondo px-4 py-3 outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
                />
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button disabled={pendiente} className="btn-primario px-5! py-2.5! text-sm disabled:opacity-60">
              {pendiente ? "Creando…" : "Crear y generar enlace"}
            </button>
            <button type="button" onClick={() => setFormAbierto(false)} className="rounded-full border border-borde px-4 py-2 text-sm text-suave">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setFormAbierto(true)} className="btn-secundario text-sm">
          + Añadir administrador
        </button>
      )}
    </div>
  );
}
