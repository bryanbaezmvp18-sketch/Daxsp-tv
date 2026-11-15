import { obtenerPrecios } from "@/lib/precios";
import { BarraOferta } from "@/components/landing/BarraOferta";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { VideoIntro } from "@/components/landing/VideoIntro";
import {
  Beneficios,
  ComoFunciona,
  Temario,
  Instructor,
  Precio,
  PreguntasFrecuentes,
  CTAFinal,
  Footer,
  CTAMovil,
} from "@/components/landing/Secciones";
import {
  Cifras,
  Dolores,
  Comparacion,
  ParaQuien,
  Testimonios,
  PilaDeValor,
} from "@/components/landing/Persuasion";

export const revalidate = 3600; // además se actualiza al instante cuando cambias precios en el panel

export default async function Home() {
  const p = await obtenerPrecios();
  return (
    <>
      <VideoIntro />
      <BarraOferta p={p} />
      <Navbar p={p} />
      <main>
        <Hero p={p} />
        <Cifras />
        <Dolores />
        <Beneficios />
        <Comparacion />
        <ComoFunciona />
        <Temario />
        <ParaQuien />
        <Instructor />
        <Testimonios />
        <PilaDeValor p={p} />
        <Precio p={p} />
        <PreguntasFrecuentes />
        <CTAFinal p={p} />
      </main>
      <Footer />
      <CTAMovil p={p} />
    </>
  );
}
