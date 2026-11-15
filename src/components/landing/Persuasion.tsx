import Link from "next/link";
import {
  cifras,
  dolores,
  comparacion,
  paraQuien,
  testimonios,
  bonos,
  valorCursoUSD,
  precio,
  curso,
  marca,
  formatoUSD,
} from "@/config/curso";
import type { Precios } from "@/lib/precios-tipos";

function Titulo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="etiqueta">{etiqueta}</span>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">{children}</h2>
    </div>
  );
}

/** Franja de cifras bajo el hero. */
export function Cifras() {
  if (!cifras.length) return null;
  return (
    <section aria-label="Cifras" className="border-y border-borde/60 bg-superficie/50">
      <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-y-6 px-4 py-8 sm:grid-cols-4">
        {cifras.map((c) => (
          <div key={c.etiqueta} className="text-center">
            <dd className="font-display text-3xl font-bold texto-degradado sm:text-4xl">{c.valor}</dd>
            <dt className="mt-1 text-xs tracking-wider text-suave uppercase">{c.etiqueta}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** ¿Te pasa esto? + la solución. */
export function Dolores() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <Titulo etiqueta="¿Te identificas?">¿Te pasa esto?</Titulo>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {dolores.map((d) => (
          <li key={d} className="tarjeta flex gap-3 p-5 text-sm sm:text-base">
            <span className="text-xl" aria-hidden>😩</span>
            <span className="text-suave">{d}</span>
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-10 max-w-2xl text-center text-lg">
        No es falta de talento. <b className="texto-degradado">Te falta un sistema.</b> Eso es exactamente lo que te
        da {marca.nombre}.
      </p>
    </section>
  );
}

/** Sin el curso vs con el curso. */
export function Comparacion() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <Titulo etiqueta="La diferencia">Antes y después de {marca.nombre}</Titulo>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="tarjeta p-6">
          <h3 className="font-display text-lg font-semibold text-suave">❌ Sin un método</h3>
          <ul className="mt-4 space-y-3">
            {comparacion.sin.map((t) => (
              <li key={t} className="flex gap-3 text-suave line-through decoration-red-400/50">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-marca-2 via-marca to-acento p-px">
          <div className="h-full rounded-2xl bg-superficie p-6">
            <h3 className="font-display text-lg font-semibold">✅ Con {marca.nombre}</h3>
            <ul className="mt-4 space-y-3">
              {comparacion.con.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="text-marca-2" aria-hidden>✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ParaQuien() {
  return (
    <section className="border-y border-borde/60 bg-superficie/40">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <Titulo etiqueta="¿Es para mí?">Este curso es para ti si…</Titulo>
        <div className="mt-10 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <ul className="tarjeta space-y-3 p-6">
            {paraQuien.si.map((t) => (
              <li key={t} className="flex gap-3">
                <span className="text-marca-2" aria-hidden>✓</span>
                {t}
              </li>
            ))}
          </ul>
          <div className="tarjeta p-6">
            <h3 className="text-sm font-semibold tracking-wider text-suave uppercase">No es para ti si…</h3>
            <ul className="mt-4 space-y-3 text-suave">
              {paraQuien.no.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="text-red-400" aria-hidden>✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonios() {
  if (!testimonios.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Titulo etiqueta="Testimonios">Lo que dicen los alumnos</Titulo>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {testimonios.map((t, i) => (
          <figure key={i} className="tarjeta flex flex-col p-6">
            <div className="text-amber-300" aria-label="5 estrellas">★★★★★</div>
            <blockquote className="mt-3 flex-1 text-sm text-suave">“{t.texto}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              {t.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.foto} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-marca/20 font-bold text-marca-2">
                  {t.nombre.charAt(0)}
                </span>
              )}
              <span>
                <b className="block text-sm">{t.nombre}</b>
                <span className="text-xs text-suave">{t.detalle}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Pila de valor: todo lo que recibe vs lo que paga. */
export function PilaDeValor({ p }: { p: Precios }) {
  const total = valorCursoUSD + bonos.reduce((n, b) => n + b.valorUSD, 0);
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <Titulo etiqueta="Todo lo que recibes">Hoy te llevas todo esto</Titulo>
      <div className="tarjeta mt-10 divide-y divide-borde">
        <div className="flex items-center justify-between gap-4 p-5">
          <span className="font-semibold">🎓 {curso.nombre}</span>
          <span className="shrink-0 text-suave">{formatoUSD(valorCursoUSD)}</span>
        </div>
        {bonos.map((b) => (
          <div key={b.titulo} className="flex items-center justify-between gap-4 p-5">
            <span>
              <span className="mr-2 rounded-full bg-acento/15 px-2 py-0.5 text-xs font-bold text-acento">BONO</span>
              {b.titulo}
            </span>
            <span className="shrink-0 text-suave">{formatoUSD(b.valorUSD)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 p-5 text-suave">
          <span>Valor total</span>
          <s className="shrink-0">{formatoUSD(total)}</s>
        </div>
        <div className="flex items-center justify-between gap-4 bg-marca/10 p-5">
          <span className="font-display text-lg font-bold">Tu precio hoy</span>
          <span className="font-display text-3xl font-bold texto-degradado">{formatoUSD(p.usd)}</span>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link href="/checkout" className="btn-comprar text-base">
          Quiero todo esto →
        </Link>
      </div>
    </section>
  );
}

/** Botón flotante de WhatsApp para dudas. */
export function BotonWhatsApp() {
  if (!marca.whatsapp) return null;
  const texto = encodeURIComponent(`Hola, tengo una pregunta sobre el curso ${curso.nombre}`);
  return (
    <a
      href={`https://wa.me/${marca.whatsapp}?text=${texto}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed right-4 bottom-24 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition hover:scale-105 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
      </svg>
    </a>
  );
}
