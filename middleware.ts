import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for health check and login page
  if (pathname === '/api/health' || pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Check auth cookie
  const auth = request.cookies.get('auth');
  if (auth?.value === process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  // Redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
