import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const jwt = request.cookies.get('jwt')

  console.log('Middleware - Pathname:', pathname);
  console.log('Middleware - JWT cookie:', jwt ? 'Presente' : 'Ausente');

  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Rutas públicas
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Si es una ruta protegida y no hay JWT, redirigir a login
  if (isProtectedRoute && !jwt) {
    console.log('Middleware - Redirigiendo a login (sin JWT)');
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si es una ruta pública y hay JWT, redirigir a dashboard
  if (isPublicRoute && jwt) {
    console.log('Middleware - Redirigiendo a dashboard (con JWT)');
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Si hay JWT en una ruta protegida, permitir el acceso
  if (isProtectedRoute && jwt) {
    console.log('Middleware - Permitiendo acceso a ruta protegida');
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ]
} 