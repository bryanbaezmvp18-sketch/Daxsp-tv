import type { NextConfig } from "next";

const proyecto = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // El modo emuladores usa su propia carpeta para no mezclar su caché con la del Firebase real
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  /**
   * Login con Google en móviles: los navegadores actuales bloquean el
   * "inicio por redirección" si el dominio de login (xxx.firebaseapp.com) es
   * distinto al de la web. Servimos /__/auth/* desde nuestro propio dominio
   * (proxy recomendado por Firebase) y ponemos NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   * = el dominio de la web. Ver README → "Login con Google".
   */
  async rewrites() {
    if (!proyecto || proyecto.startsWith("demo-")) return [];
    return [
      { source: "/__/auth/:path*", destination: `https://${proyecto}.firebaseapp.com/__/auth/:path*` },
      { source: "/__/firebase/:path*", destination: `https://${proyecto}.firebaseapp.com/__/firebase/:path*` },
    ];
  },
};

export default nextConfig;
