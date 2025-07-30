import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> }
) {
  try {
    const { tipo } = await params

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de plantilla no especificado' },
        { status: 400 }
      )
    }

    // Validar tipo de plantilla
    const tiposValidos = ['productos', 'proveedores', 'movimientos']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo de plantilla no válido. Tipos válidos: ${tiposValidos.join(', ')}` },
        { status: 400 }
      )
    }

    // Obtener todas las cookies del request
    const cookies = request.headers.get('cookie') || ''

    // Enviar al backend con las cookies de autenticación
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/importacion/plantillas/${tipo}`, {
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
        { error: errorData.message || 'Error al obtener la plantilla' },
        { status: response.status }
      )
    }

    // Obtener el archivo como blob
    const blob = await response.blob()
    
    // Crear respuesta con el archivo
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="plantilla-${tipo}.xlsx"`,
      },
    })

  } catch (error) {
    console.error('Error obteniendo plantilla:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 