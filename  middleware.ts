
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permettre l'accès aux API routes et aux ressources statiques
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Routes d'initialisation - toujours accessibles
  if (pathname === '/' || pathname === '/setup') {
    return NextResponse.next();
  }

  // Pour toutes les autres routes, rediriger vers la page d'initialisation
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};