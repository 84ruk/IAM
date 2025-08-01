import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/api',
  '/favicon.ico',
  '/_next',
  '/fonts',
  '/images',
]

// Rutas que requieren setup de empresa
const SETUP_REQUIRED_PATHS = [
  '/dashboard',
  '/admin',
  '/productos',
  '/proveedores',
  '/movimientos',
  '/pedidos',
  '/inventario',
]

// Rutas que no requieren setup
const SETUP_EXEMPT_PATHS = [
  '/setup-empresa',
  '/auth',
  '/api/auth',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Obtener JWT de las cookies
  const jwt = request.cookies.get('jwt')?.value

  // Si no hay JWT, redirigir a login (excepto para rutas de setup)
  if (!jwt) {
    if (pathname.startsWith('/setup-empresa')) {
      return NextResponse.next()
    }
    
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Para rutas que requieren setup, verificar si el usuario necesita configurar empresa
  if (SETUP_REQUIRED_PATHS.some((path) => pathname.startsWith(path))) {
    try {
      // Verificar setup usando el endpoint del backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const setupResponse = await fetch(`${apiUrl}/auth/needs-setup`, {
        headers: {
          'Cookie': `jwt=${jwt}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (setupResponse.ok) {
        const setupData = await setupResponse.json()
        
        // Si necesita setup, redirigir a setup-empresa
        if (setupData.needsSetup) {
          console.log('🔄 Middleware: Usuario necesita setup, redirigiendo a setup-empresa')
          const setupUrl = new URL('/setup-empresa', request.url)
          return NextResponse.redirect(setupUrl)
        }
      }
    } catch (error) {
      console.error('❌ Middleware: Error verificando setup:', error)
      // En caso de error, permitir acceso (fallback a verificación del lado del cliente)
    }
  }

  // Para rutas de setup, verificar que el usuario NO tenga setup completo
  if (pathname.startsWith('/setup-empresa')) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const setupResponse = await fetch(`${apiUrl}/auth/needs-setup`, {
        headers: {
          'Cookie': `jwt=${jwt}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (setupResponse.ok) {
        const setupData = await setupResponse.json()
        
        // Si NO necesita setup, redirigir al dashboard
        if (!setupData.needsSetup) {
          console.log('🔄 Middleware: Usuario ya tiene setup completo, redirigiendo a dashboard')
          const dashboardUrl = new URL('/dashboard', request.url)
          return NextResponse.redirect(dashboardUrl)
        }
      }
    } catch (error) {
      console.error('❌ Middleware: Error verificando setup en setup-empresa:', error)
      // En caso de error, permitir acceso
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 