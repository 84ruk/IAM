import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    
    // Probar conexión al backend
    const healthCheck = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!healthCheck.ok) {
      return NextResponse.json({
        error: 'Backend no disponible',
        status: healthCheck.status,
        url: `${backendUrl}/health`
      }, { status: 503 })
    }

    // Probar endpoint de plantillas
    const plantillasResponse = await fetch(`${backendUrl}/importacion/plantillas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    let plantillasData = null
    if (plantillasResponse.ok) {
      plantillasData = await plantillasResponse.json()
    }

    // Probar descarga de plantilla de productos
    const productosResponse = await fetch(`${backendUrl}/importacion/plantillas/productos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return NextResponse.json({
      success: true,
      backend: {
        url: backendUrl,
        status: 'online',
        healthCheck: healthCheck.status
      },
      plantillas: {
        listado: plantillasResponse.ok ? 'funcionando' : `error ${plantillasResponse.status}`,
        data: plantillasData
      },
      descarga: {
        productos: productosResponse.ok ? 'funcionando' : `error ${productosResponse.status}`,
        contentType: productosResponse.headers.get('content-type')
      }
    })

  } catch (error) {
    console.error('Error en test de plantillas:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
} 