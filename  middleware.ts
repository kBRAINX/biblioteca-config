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

    // Routes toujours accessibles
    const publicRoutes = ['/', '/login', '/setup'];

    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Pour les routes protégées (/dashboard, /admin, /configuration, /profile, etc.)
    // Rediriger vers la page d'accueil qui gère l'état du système et l'authentification
    if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/configuration') ||
        pathname.startsWith('/profile')
    ) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
