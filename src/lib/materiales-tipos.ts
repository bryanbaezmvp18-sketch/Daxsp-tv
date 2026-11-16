/** Tipos y reglas de los archivos del curso (se usa en el navegador y en el servidor). */

export type TipoMaterial = "guia" | "kit" | "plantilla" | "video" | "documento";

/** Secciones en el orden en que las ve el alumno. */
export const SECCIONES_MATERIAL: { tipo: TipoMaterial; titulo: string; icono: string; ayuda: string }[] = [
  { tipo: "guia", titulo: "Empieza aquí", icono: "📖", ayuda: "Guías e instrucciones. Si es .txt o .md se lee directo en la página." },
  { tipo: "kit", titulo: "Kit para Claude", icono: "🧩", ayuda: "Archivos .zip que el alumno descarga tal cual." },
  { tipo: "plantilla", titulo: "Plantillas y scripts", icono: "📝", ayuda: "Textos que el alumno puede ver y copiar (.txt, .md, .js, .py…)." },
  { tipo: "video", titulo: "Videos", icono: "🎬", ayuda: "Se ven dentro de la página (.mp4, .mov, .webm)." },
  { tipo: "documento", titulo: "Documentos", icono: "📄", ayuda: "PDF, Word u otros archivos para descargar." },
];

export const DESCRIPCION_POR_TIPO: Record<TipoMaterial, string> = {
  guia: "Léelo primero: instalación y uso paso a paso.",
  kit: "Súbelo a Claude tal cual, sin descomprimirlo.",
  plantilla: "Cópialo y pégalo en Claude.",
  video: "Míralo en línea.",
  documento: "Descárgalo y guárdalo.",
};

export const EXT_TEXTO = [".txt", ".md", ".js", ".py", ".json", ".html"];

export const MIME_POR_EXT: Record<string, string> = {
  ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".py": "text/x-python; charset=utf-8", ".json": "application/json", ".html": "text/html; charset=utf-8",
  ".pdf": "application/pdf", ".zip": "application/zip", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".mp3": "audio/mpeg",
};

/** Tamaño máximo por archivo (lo mismo que permiten las reglas de Storage). */
export const MAX_BYTES_MATERIAL = 1024 * 1024 * 1024; // 1 GB

export const extension = (nombre: string) => {
  const i = nombre.lastIndexOf(".");
  return i > 0 ? nombre.slice(i).toLowerCase() : "";
};

/** Sección sugerida según el nombre y la extensión (el admin puede cambiarla). */
export function tipoSugerido(nombre: string): TipoMaterial {
  const ext = extension(nombre);
  const n = nombre.toLowerCase();
  if ([".txt", ".md", ".pdf", ".docx"].includes(ext) && /leeme|l[eé]eme|gu[ií]a|instrucciones|pasos|readme/.test(n)) return "guia";
  if (ext === ".zip") return "kit";
  if (EXT_TEXTO.includes(ext)) return "plantilla";
  if ([".mp4", ".mov", ".webm"].includes(ext)) return "video";
  return "documento";
}

/** "LEEME - como instalar.txt" → "Leeme - como instalar"; "animacion-2d-pro.zip" → "Animacion 2d pro" */
export function tituloSugerido(nombre: string) {
  const sinExt = nombre.replace(/\.[^.]+$/, "");
  const base = /\s/.test(sinExt) ? sinExt : sinExt.replace(/[-_]+/g, " ");
  const t = base.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const tamanoLegible = (b: number) =>
  b >= 1024 * 1024 * 1024 ? `${(b / 1024 / 1024 / 1024).toFixed(2)} GB` : b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
