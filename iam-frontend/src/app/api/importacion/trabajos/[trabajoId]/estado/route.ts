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

    // Obtener estado del trabajo desde el backend existente
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/importacion/trabajos/${trabajoId}/estado`, {
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
        { error: errorData.message || 'Error al obtener el estado del trabajo' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      trabajo: data.trabajo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error obteniendo estado del trabajo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 