import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const protectedPaths = ['/tablero', '/admin', '/menu', '/mi-equipo'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next({ request });
  }

  const cookies = request.cookies.getAll();
  console.log('[PROXY]', pathname, 'Cookies:', cookies.map(c => c.name).join(', ') || 'NINGUNA');

  const authCookie = cookies.find(
    (c) => c.name.startsWith('sb-') && c.name.includes('auth-token')
  );

  if (!authCookie) {
    console.log('[PROXY] No auth cookie encontrada, redirigiendo a /login');
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  console.log('[PROXY] Cookie encontrada, dejando pasar');
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/tablero/:path*',
    '/admin/:path*',
    '/menu/:path*',
    '/mi-equipo/:path*',
  ],
};