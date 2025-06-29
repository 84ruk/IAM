import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api',
  '/favicon.ico',
  '/_next',
  '/fonts',
  '/images',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Proteger rutas privadas
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const jwt = request.cookies.get('jwt')?.value
    if (!jwt) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
} 