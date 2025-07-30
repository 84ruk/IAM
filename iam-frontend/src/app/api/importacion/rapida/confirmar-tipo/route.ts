import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { archivoTemporal, tipoConfirmado } = body

    if (!archivoTemporal) {
      return NextResponse.json(
        { error: 'Archivo temporal no proporcionado' },
        { status: 400 }
      )
    }

    if (!tipoConfirmado) {
      return NextResponse.json(
        { error: 'Tipo confirmado no especificado' },
        { status: 400 }
      )
    }

    // Obtener todas las cookies del request
    const cookies = request.headers.get('cookie') || ''

    // Enviar al backend con las cookies de autenticación
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/importacion/rapida/confirmar-tipo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies,
        },
        body: JSON.stringify({
          archivoTemporal,
          tipoConfirmado,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || result.message || 'Error confirmando tipo' },
        { status: response.status }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error en confirmación de tipo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 