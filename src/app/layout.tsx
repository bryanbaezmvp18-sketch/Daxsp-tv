import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { curso, marca } from "@/config/curso";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: `${marca.nombre} · ${marca.eslogan}`,
  description: curso.subtitulo,
  openGraph: { title: curso.nombre, description: curso.subtitulo, type: "website", locale: "es_DO" },
};

export const viewport: Viewport = {
  themeColor: "#07060d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // respeta la barra de inicio del iPhone
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
