import Image from "next/image";
import Link from "next/link";
import {
  beneficios,
  pasos,
  temario,
  instructor,
  faq,
  precio,
  curso,
  marca,
  formatoUSD,
  formatoDOP,
} from "@/config/curso";
import { Logo } from "./Logo";
import { Cronometro, SiVigente } from "@/components/Cronometro";
import { descuento, type Precios } from "@/lib/precios-tipos";

function Encabezado({ etiqueta, titulo, texto }: { etiqueta: string; titulo: React.ReactNode; texto?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="etiqueta">{etiqueta}</span>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">{titulo}</h2>
      {texto && <p className="mt-4 text-suave">{texto}</p>}
    </div>
  );
}

export function Beneficios() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Encabezado
        etiqueta="Beneficios"
        titulo={<>Todo lo que necesitas para <span className="texto-degradado">crecer sin cámara</span></>}
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {beneficios.map((b) => (
          <article key={b.titulo} className="tarjeta p-6 transition hover:border-marca/50">
            <div className="text-3xl" aria-hidden>{b.icono}</div>
            <h3 className="mt-4 font-display text-lg font-semibold">{b.titulo}</h3>
            <p className="mt-2 text-sm text-suave">{b.texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="border-y border-borde/60 bg-superficie/40">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <Encabezado etiqueta="Cómo funciona" titulo="Tres pasos. Todos los días." />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {pasos.map((p, i) => (
            <li key={p.titulo} className="tarjeta relative p-6">
              <span className="font-display text-5xl font-bold text-marca/30">0{i + 1}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{p.titulo}</h3>
              <p className="mt-2 text-sm text-suave">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Temario() {
  const total = temario.reduce((n, m) => n + m.lecciones.length, 0);
  return (
    <section id="temario" className="mx-auto max-w-3xl px-4 py-20">
      <Encabezado
        etiqueta="Temario"
        titulo="Lo que vas a aprender"
        texto={`${temario.length} módulos · ${total} lecciones en video y PDFs descargables`}
      />
      <div className="mt-10 space-y-3">
        {temario.map((m, i) => (
          <details key={m.titulo} className="tarjeta group overflow-hidden" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold">
              <span>{m.titulo}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs font-normal whitespace-nowrap text-suave sm:text-sm">
                {m.lecciones.length} <span className="hidden sm:inline">lecciones</span>
                <svg className="chevron h-4 w-4 transition" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
                </svg>
              </span>
            </summary>
            <ul className="border-t border-borde px-5 py-3">
              {m.lecciones.map((l) => (
                <li key={l} className="flex items-center gap-3 py-2 text-sm text-suave">
                  <span className="text-marca-2" aria-hidden>▶</span>
                  {l}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Instructor() {
  return (
    <section className="border-y border-borde/60 bg-superficie/40">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-20 md:grid-cols-[280px_1fr]">
        <div className="relative mx-auto aspect-square w-56 md:w-full">
          <div className="absolute -inset-3 rounded-full bg-linear-to-br from-marca-2/40 to-acento/40 blur-xl" />
          {instructor.foto ? (
            <Image
              src={instructor.foto}
              alt={instructor.nombre}
              fill
              sizes="280px"
              className="relative rounded-full border-2 border-white/10 object-cover"
            />
          ) : (
            <div className="relative grid h-full w-full place-items-center rounded-full border-2 border-dashed border-borde bg-superficie text-center text-sm text-suave">
              Foto del
              <br />
              instructor
            </div>
          )}
        </div>
        <div className="text-center md:text-left">
          <span className="etiqueta">Tu instructor</span>
          <h2 className="mt-4 font-display text-3xl font-bold">{instructor.nombre}</h2>
          <p className="text-marca-2">{instructor.rol}</p>
          <p className="mt-4 text-suave">{instructor.bio}</p>
          <dl className="mt-6 flex justify-center gap-8 md:justify-start">
            {instructor.stats.map((s) => (
              <div key={s.etiqueta}>
                <dt className="sr-only">{s.etiqueta}</dt>
                <dd className="font-display text-3xl font-bold texto-degradado">{s.valor}</dd>
                <dd className="text-xs uppercase tracking-wider text-suave">{s.etiqueta}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

const incluye = [
  "Acceso de por vida a todos los módulos",
  "Lecciones en video paso a paso",
  "PDFs y plantillas descargables",
  "Actualizaciones futuras sin costo",
  "Progreso guardado por lección",
];

export function Precio({ p }: { p: Precios }) {
  const ahorro = descuento(p);
  return (
    <section id="precio" className="relative mx-auto max-w-6xl px-4 py-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-80 max-w-xl rounded-full bg-marca/20 blur-[120px]" />
      <Encabezado etiqueta="Precio" titulo="Una inversión, acceso para siempre" />

      <div className="relative mx-auto mt-12 max-w-md rounded-3xl bg-linear-to-br from-marca-2 via-marca to-acento p-px">
        <div className="rounded-3xl bg-superficie p-8">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold">{curso.nombre}</h3>
            {ahorro > 0 && (
              <span className="rounded-full bg-acento/15 px-3 py-1 text-xs font-bold text-acento">-{ahorro}%</span>
            )}
          </div>

          {p.oferta.activa && p.oferta.terminaEn && (
            <SiVigente fin={p.oferta.terminaEn}>
              <div className="mt-6 rounded-2xl border border-acento/25 bg-acento/5 p-4 text-center">
                <p className="mb-3 text-sm font-semibold text-acento">⏳ {p.oferta.texto} · termina en</p>
                <Cronometro fin={p.oferta.terminaEn} />
              </div>
            </SiVigente>
          )}

          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-5xl font-bold">{formatoUSD(p.usd)}</span>
            {p.usdAntes && <s className="pb-2 text-lg text-suave">{formatoUSD(p.usdAntes)}</s>}
          </div>
          <p className="mt-1 text-sm text-suave">
            {precio.pagoUnico && "Pago único · "}o {formatoDOP(p.dop)} por transferencia
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            {incluye.map((i) => (
              <li key={i} className="flex gap-3">
                <span className="text-marca-2" aria-hidden>✓</span>
                {i}
              </li>
            ))}
          </ul>

          <Link href="/checkout" className="btn-primario mt-8 w-full text-base">
            Comprar ahora →
          </Link>
          <p className="mt-4 text-center text-xs text-suave">
            💳 Tarjeta de crédito/débito · PayPal · 🏦 Transferencia bancaria
          </p>
        </div>
      </div>

      {precio.garantiaDias > 0 && (
        <div className="tarjeta relative mx-auto mt-8 flex max-w-md items-center gap-4 p-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-marca-2 font-display text-lg font-bold text-marca-2">
            {precio.garantiaDias}d
          </div>
          <p className="text-sm text-suave">
            <b className="text-texto">Garantía de {precio.garantiaDias} días.</b> Si el curso no es para ti, te devolvemos
            el 100% de tu dinero. Sin preguntas incómodas.
          </p>
        </div>
      )}
    </section>
  );
}

export function PreguntasFrecuentes() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
      <Encabezado etiqueta="Preguntas frecuentes" titulo="¿Tienes dudas?" />
      <div className="mt-10 space-y-3">
        {faq.map((f) => (
          <details key={f.p} className="tarjeta">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold">
              {f.p}
              <svg className="chevron h-4 w-4 shrink-0 text-suave transition" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
              </svg>
            </summary>
            <p className="px-5 pb-5 text-sm text-suave">{f.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CTAFinal({ p }: { p: Precios }) {
  return (
    <section className="px-4 pb-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-borde bg-linear-to-br from-marca/30 via-superficie to-acento/20 px-6 py-14 text-center">
        <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">
          Tu próximo video viral <span className="texto-degradado">empieza hoy</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-suave">
          Únete a {marca.nombre} y aprende el método completo para crear contenido sin salir en cámara.
        </p>
        <Link href="/checkout" className="btn-primario mt-8 text-base">
          Comprar ahora · {formatoUSD(p.usd)}
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-borde/60 pb-24 sm:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-suave md:flex-row">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span>© {new Date().getFullYear()} {marca.nombre}</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-5">
          <Link href="/terminos" className="hover:text-texto">Términos</Link>
          <Link href="/privacidad" className="hover:text-texto">Privacidad</Link>
          <a href={`mailto:${marca.soporteEmail}`} className="hover:text-texto">Soporte</a>
          <a href={marca.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-texto">Instagram</a>
        </nav>
      </div>
    </footer>
  );
}

/** Barra fija inferior solo en móvil. */
export function CTAMovil({ p }: { p: Precios }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-fondo/90 px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="leading-tight">
          <div className="font-display text-lg font-bold">{formatoUSD(p.usd)}</div>
          {p.usdAntes && <s className="text-xs text-suave">{formatoUSD(p.usdAntes)}</s>}
        </div>
        <Link href="/checkout" className="btn-primario flex-1 py-3!">
          Comprar ahora
        </Link>
      </div>
    </div>
  );
}
