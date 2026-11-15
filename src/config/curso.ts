/**
 * CONFIGURACIÓN CENTRAL DE DAXSP TV
 * ---------------------------------
 * Todo el texto y los precios de la web salen de aquí.
 * Los valores marcados con "EJEMPLO" son provisionales: cámbialos por los reales.
 *
 * IMPORTANTE: el servidor usa ESTE archivo para cobrar. El precio que mande
 * el navegador nunca se tiene en cuenta.
 */

export const marca = {
  nombre: "Daxsp TV",
  eslogan: "Crea videos virales sin salir en cámara", // EJEMPLO
  instagram: "https://instagram.com/", // EJEMPLO
  soporteEmail: "soporte@daxsp.tv", // EJEMPLO
  // WhatsApp con código de país, solo números (ej. 18091234567). Vacío = oculta el botón.
  whatsapp: "18090000000", // EJEMPLO
};

/* ───────────── ELEMENTOS PERSUASIVOS DE LA LANDING ─────────────
 * Usa SOLO datos reales: cifras, testimonios y resultados inventados
 * pueden traerte problemas legales y destruyen la confianza.
 */

/** Cifras bajo el hero. Deja el array vacío para ocultar la franja. */
export const cifras = [
  { valor: "+1,000", etiqueta: "alumnos" }, // EJEMPLO
  { valor: "+50M", etiqueta: "vistas generadas" }, // EJEMPLO
  { valor: "4.9★", etiqueta: "valoración" }, // EJEMPLO
  { valor: "24/7", etiqueta: "acceso al curso" },
];

/** "¿Te pasa esto?" — dolores del cliente. */
export const dolores = [
  "Quieres crear contenido pero te da vergüenza salir en cámara.",
  "Publicas videos y no pasan de 200 vistas.",
  "Pasas horas editando y no tienes tiempo para ser constante.",
  "Ves páginas faceless creciendo y no sabes cómo lo hacen.",
];

/** Comparación antes / después. */
export const comparacion = {
  sin: [
    "Horas editando cada video",
    "Ideas al azar, sin estrategia",
    "Miedo a mostrar tu cara",
    "Vistas estancadas",
  ],
  con: [
    "Un video listo en menos de 1 hora",
    "Temas probados que enganchan",
    "100% faceless: nadie te ve",
    "Un sistema para crecer cada semana",
  ],
};

export const paraQuien = {
  si: [
    "Quieres empezar una página faceless desde cero",
    "Tienes un celular o computadora y ganas de aprender",
    "Buscas un ingreso extra creando contenido",
    "Ya creas contenido pero quieres más vistas",
  ],
  no: [
    "Buscas hacerte rico de la noche a la mañana",
    "No estás dispuesto a publicar con constancia",
  ],
};

/** Testimonios REALES de alumnos (nombre, texto y opcionalmente foto en /public). */
export const testimonios: { nombre: string; detalle: string; texto: string; foto?: string }[] = [
  // EJEMPLO — reemplaza por testimonios reales o deja el array vacío para ocultar la sección
  { nombre: "Nombre del alumno", detalle: "Ciudad · resultado logrado", texto: "Aquí va lo que dijo un alumno real sobre el curso. Pide permiso para publicarlo." },
  { nombre: "Nombre del alumno", detalle: "Ciudad · resultado logrado", texto: "Un segundo testimonio real. Los que mencionan resultados concretos convencen más." },
  { nombre: "Nombre del alumno", detalle: "Ciudad · resultado logrado", texto: "Un tercer testimonio real. Puedes añadir una captura o foto del alumno." },
];

/** Bonos incluidos y su valor de referencia (para la "pila de valor"). */
export const bonos = [
  { titulo: "Pack de 100 temas virales", valorUSD: 27 }, // EJEMPLO
  { titulo: "Plantillas de guiones con hook", valorUSD: 19 }, // EJEMPLO
  { titulo: "Lista de herramientas de IA gratis", valorUSD: 15 }, // EJEMPLO
];
/** Valor de referencia del curso principal (sin bonos). */
export const valorCursoUSD = 97; // EJEMPLO

export const curso = {
  nombre: "Daxsp TV: Videos Virales con IA", // EJEMPLO
  titulo: "Tu IA hace el video. Tú solo lo publicas.", // EJEMPLO
  subtitulo:
    "Aprende paso a paso a crear Reels, Shorts y TikToks faceless con inteligencia artificial: guion, voz, edición y publicación, sin grabarte nunca.", // EJEMPLO
};

/** Precios. PayPal no acepta RD$, por eso la tarjeta/PayPal cobra en USD. */
export const precio = {
  usd: 29.9, // EJEMPLO — precio que cobra PayPal
  usdAntes: 37, // EJEMPLO — precio tachado (pon null para ocultarlo)
  dop: 1800, // EJEMPLO — precio en RD$ para transferencia bancaria
  garantiaDias: 7, // EJEMPLO — pon 0 para ocultar la garantía
  pagoUnico: true,
};

export const formatoUSD = (n: number) =>
  `US$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const formatoDOP = (n: number) =>
  `RD$${n.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;

/** Oferta con cuenta regresiva. Pon `activa: false` para ocultar la barra. */
export const oferta = {
  activa: true,
  texto: "Precio de lanzamiento por tiempo limitado",
  // Fecha fija de fin (ISO). Si ya pasó, la barra se oculta sola.
  terminaEn: "2026-11-30T23:59:00-04:00", // EJEMPLO
};

export const beneficios = [
  // EJEMPLO
  { icono: "🎬", titulo: "Sin cámara ni micrófono", texto: "Tu cara y tu voz no salen nunca. La IA narra y tú diriges." },
  { icono: "⚡", titulo: "Un video en menos de 1 hora", texto: "Un sistema repetible para publicar todos los días sin quemarte." },
  { icono: "🧠", titulo: "Guiones que enganchan", texto: "Fórmulas de hook de 3 segundos y estructuras que retienen hasta el final." },
  { icono: "📈", titulo: "Pensado para crecer", texto: "Elige nichos rentables y entiende qué hace que un video se comparta." },
  { icono: "🛠️", titulo: "Herramientas gratis o baratas", texto: "Trabajas con IA accesible; nada de software caro." },
  { icono: "♾️", titulo: "Acceso de por vida", texto: "Paga una vez y vuelve al material cuando quieras, con actualizaciones." },
];

export const pasos = [
  // EJEMPLO
  { titulo: "Elige tu nicho", texto: "Encuentra un tema con demanda y poca competencia." },
  { titulo: "La IA lo produce", texto: "Guion, voz, imágenes y edición siguiendo el método." },
  { titulo: "Publica y crece", texto: "Sube el video con título y hashtags optimizados." },
];

/** Temario visible en la landing. El contenido real del área del alumno vive en Firestore. */
export const temario = [
  // EJEMPLO
  {
    titulo: "Módulo 1 · Fundamentos del contenido faceless",
    lecciones: ["Qué es un canal faceless y por qué funciona", "Cómo elegir un nicho rentable", "Configura tus herramientas de IA"],
  },
  {
    titulo: "Módulo 2 · Del tema al video terminado",
    lecciones: ["Guiones con hook de 3 segundos", "Voz con IA que suena natural", "Edición, subtítulos y música"],
  },
  {
    titulo: "Módulo 3 · Publicar y crecer",
    lecciones: ["Títulos, descripciones y hashtags", "Frecuencia y análisis de métricas", "Cómo monetizar tu página"],
  },
];

export const instructor = {
  // EJEMPLO
  nombre: "Tu nombre",
  rol: "Creador de Daxsp TV",
  bio: "Escribe aquí 2 o 3 líneas sobre ti: qué has logrado creando contenido, cuántas vistas o seguidores has conseguido y por qué decidiste enseñar el método.",
  foto: null as string | null, // p. ej. "/instructor.jpg" dentro de /public
  stats: [
    { valor: "+1M", etiqueta: "vistas" },
    { valor: "+10K", etiqueta: "seguidores" },
    { valor: "+100", etiqueta: "videos" },
  ],
};

export const faq = [
  // EJEMPLO
  { p: "¿Necesito experiencia previa?", r: "No. El curso empieza desde cero y cada lección es paso a paso." },
  { p: "¿Tengo que salir en cámara o usar mi voz?", r: "No. Todo el método es faceless: la voz y las imágenes se generan con IA." },
  { p: "¿Cómo recibo el acceso?", r: "No necesitas crear cuenta. Cuando confirmamos tu pago te enviamos por WhatsApp y correo un enlace personal para entrar al curso. Por transferencia lo verificamos normalmente en menos de 24 horas." },
  { p: "¿Es un pago único o una suscripción?", r: "Pago único. Sin mensualidades." },
  { p: "¿Puedo pagar sin cuenta PayPal?", r: "Sí. En el checkout puedes pagar con tarjeta de crédito o débito sin crear cuenta PayPal, o por transferencia bancaria." },
  { p: "¿Cuánto tiempo tengo acceso?", r: "De por vida, incluidas las actualizaciones del curso." },
  { p: "¿Y si no me funciona?", r: `Tienes ${precio.garantiaDias} días de garantía. Si no te convence, escríbenos y te devolvemos tu dinero.` },
];

// Las cuentas bancarias se administran desde el panel: /admin/cuentas
