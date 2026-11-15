import { NextResponse, type NextRequest } from "next/server";

/**
 * Primera barrera (Edge): sin cookie no se entra.
 * La verificación real (firma, revocación, claim admin, token del alumno)
 * se hace en el servidor de cada página y API con el Admin SDK.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();
  url.search = "";

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || req.cookies.get("__session")?.value) return NextResponse.next();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/mi-cuenta") || pathname.startsWith("/checkout")) {
    if (req.cookies.get("daxsp_cliente")?.value) return NextResponse.next();
    url.pathname = "/entrar";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/mi-curso")) {
    if (req.cookies.get("daxsp_acceso")?.value) return NextResponse.next();
    url.pathname = "/acceso";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mi-cuenta/:path*", "/checkout/:path*", "/mi-curso/:path*", "/admin/:path*"],
};
