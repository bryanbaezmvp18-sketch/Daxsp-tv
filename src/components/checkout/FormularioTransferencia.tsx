"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatoDOP } from "@/config/curso";
import type { Precios } from "@/lib/precios-tipos";
import type { CuentaPublica } from "@/lib/bancos";
import type { DatosCliente } from "@/lib/cliente";
import { BotonCopiar } from "./BotonCopiar";
import { Campo, faltanDatos } from "./campos";

const MAX_FOTOS = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS_OK = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

export function FormularioTransferencia({ datos, cuentas, p }: { datos: DatosCliente; cuentas: CuentaPublica[]; p: Precios }) {
  const router = useRouter();
  const [banco, setBanco] = useState(cuentas.length === 1 ? cuentas[0].id : "");
  const [fotos, setFotos] = useState<{ archivo: File; vista: string | null }[]>([]);
  const [error, setError] = useState("");
  const [paso, setPaso] = useState<"" | "subiendo" | "guardando">("");

  function agregar(lista: FileList | null) {
    setError("");
    if (!lista) return;
    const nuevas = [...fotos];
    for (const f of Array.from(lista)) {
      if (nuevas.length >= MAX_FOTOS) {
        setError(`Puedes adjuntar hasta ${MAX_FOTOS} fotos.`);
        break;
      }
      if (!TIPOS_OK.includes(f.type)) {
        setError("Solo se aceptan fotos (JPG, PNG, WEBP) o PDF.");
        continue;
      }
      if (f.size > MAX_BYTES) {
        setError(`"${f.name}" pesa más de 5 MB. Toma una captura de pantalla en su lugar.`);
        continue;
      }
      nuevas.push({ archivo: f, vista: f.type.startsWith("image/") ? URL.createObjectURL(f) : null });
    }
    setFotos(nuevas);
  }

  function quitar(i: number) {
    setFotos((fs) => {
      if (fs[i]?.vista) URL.revokeObjectURL(fs[i].vista!);
      return fs.filter((_, j) => j !== i);
    });
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const falta = faltanDatos(datos);
    if (falta) {
      document.getElementById("paso-datos")?.scrollIntoView({ behavior: "smooth" });
      return setError(falta);
    }
    if (!banco) return setError("Elige la cuenta a la que transferiste.");
    if (!fotos.length) return setError("Adjunta al menos una foto del comprobante.");
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    try {
      setPaso("subiendo");
      // Firebase solo se carga al enviar, para que el checkout abra rápido
      const [{ clientAuth, clientStorage }, { ref, uploadBytes }] = await Promise.all([
        import("@/lib/firebase/client"),
        import("firebase/storage"),
      ]);
      const auth = clientAuth();
      await auth.authStateReady();
      // Las fotos se suben con SU cuenta de Google (a su carpeta privada)
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        throw new Error("Tu sesión de Google se cerró en este navegador. Vuelve a entrar con Google para enviar el pago.");
      }
      const pedidoId = crypto.randomUUID();
      const rutas = await Promise.all(
        fotos.map(async ({ archivo }, i) => {
          const ext = archivo.type === "application/pdf" ? "pdf" : archivo.type.split("/")[1];
          const ruta = `comprobantes/${user.uid}/${pedidoId}/foto-${i + 1}.${ext}`;
          await uploadBytes(ref(clientStorage(), ruta), archivo, { contentType: archivo.type });
          return ruta;
        }),
      );

      setPaso("guardando");
      const res = await fetch("/api/pedidos/transferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, ...form, cuentaId: banco, pedidoId, rutas, idToken: await user.getIdToken() }),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error ?? "No pudimos registrar tu pago.");
      router.push("/mi-cuenta"); // ahí ve el estado de su pago
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === "storage/unauthorized"
          ? "Una de las fotos no es válida (máx. 5 MB, imagen o PDF)."
          : err instanceof Error && !code
            ? err.message
            : "Hubo un problema de conexión. Inténtalo de nuevo.",
      );
      setPaso("");
    }
  }

  const hoy = new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD

  if (!cuentas.length) {
    return (
      <div className="py-6 text-center">
        <div className="text-4xl" aria-hidden>🏦</div>
        <p className="mt-3 font-semibold">Las transferencias no están disponibles en este momento</p>
        <p className="mt-1 text-sm text-suave">Puedes pagar con tarjeta o escribirnos por WhatsApp.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* Cuentas */}
      <fieldset>
        <legend className="font-semibold">
          Transfiere <span className="texto-degradado">{formatoDOP(p.dop)}</span> a una de estas cuentas
        </legend>
        <p className="mt-1 text-xs text-suave">Toca la cuenta a la que transferiste. Usa «Copiar» para pegar los datos en tu banco.</p>
        <div className="mt-3 space-y-3" role="radiogroup">
          {cuentas.map((c) => {
            const activa = banco === c.id;
            return (
              <div
                key={c.id}
                role="radio"
                aria-checked={activa}
                tabIndex={0}
                onClick={() => setBanco(c.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setBanco(c.id)}
                className={`cursor-pointer rounded-2xl p-4 transition ${
                  activa ? "border-2 border-marca bg-marca/10" : "border border-borde hover:border-marca/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{c.banco}</span>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${activa ? "border-marca bg-marca text-white" : "border-borde"}`}>
                    {activa ? "✓" : ""}
                  </span>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  {[
                    ["Tipo", c.tipo],
                    ["Número", c.numero],
                    ["Titular", c.titular],
                    ["Cédula/RNC", c.documento],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <dt className="text-suave">{k}</dt>
                      <dd className="flex min-w-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="truncate font-mono">{v}</span>
                        <BotonCopiar valor={v} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* Detalles */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-semibold">Detalles de tu transferencia</legend>
        <Campo label="Banco desde el que transferiste" name="bancoOrigen" required maxLength={60} placeholder="Ej. Banreservas" />
        <Campo label="Monto transferido (RD$)" name="monto" type="number" inputMode="decimal" min={1} step="0.01" defaultValue={p.dop} required />
        <Campo label="Fecha" name="fecha" type="date" max={hoy} defaultValue={hoy} required />
        <Campo label="Número de referencia (opcional)" name="referencia" maxLength={60} />
      </fieldset>

      {/* Fotos */}
      <div>
        <span className="mb-1.5 block font-semibold">Fotos del comprobante</span>
        <p className="mb-3 text-xs text-suave">Hasta {MAX_FOTOS} fotos o capturas (o PDF), máximo 5 MB cada una.</p>
        <div className="grid grid-cols-3 gap-3">
          {fotos.map((f, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-borde bg-fondo">
              {f.vista ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.vista} alt={`Comprobante ${i + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center p-2 text-center text-xs text-suave">📄<br />{f.archivo.name}</div>
              )}
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label={`Quitar foto ${i + 1}`}
                className="absolute top-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-sm text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-borde text-center text-xs text-suave transition hover:border-marca/60">
              <span className="text-2xl" aria-hidden>📷</span>
              {fotos.length ? "Agregar otra" : "Agregar foto"}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  agregar(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Nota (opcional)</span>
        <textarea
          name="nota"
          rows={2}
          maxLength={300}
          placeholder="¿Algo que debamos saber sobre tu pago?"
          className="w-full rounded-xl border border-borde bg-fondo px-4 py-3 outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={!!paso} className="btn-primario w-full text-base disabled:opacity-60">
        {paso === "subiendo" ? "Subiendo fotos…" : paso === "guardando" ? "Registrando tu pago…" : "Enviar comprobante"}
      </button>
      <p className="text-center text-xs text-suave">Revisamos los pagos manualmente, normalmente en menos de 24 horas.</p>
    </form>
  );
}
