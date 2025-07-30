import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trabajoId: string }> }
) {
  try {
    const { trabajoId } = await params

    if (!trabajoId) {
      return NextResponse.json(
        { error: 'ID de trabajo no proporcionado' },
        { status: 400 }
      )
    }

    // Obtener todas las cookies del request
    const cookies = request.headers.get('cookie') || ''

    // Enviar al backend con las cookies de autenticación
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/importacion/trabajos/${trabajoId}/reporte-errores`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || 'Error al obtener el reporte de errores' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data,
      message: 'Reporte de errores obtenido correctamente'
    })

  } catch (error) {
    console.error('Error obteniendo reporte de errores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 