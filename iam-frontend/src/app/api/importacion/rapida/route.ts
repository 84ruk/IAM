import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const archivo = formData.get('archivo') as File
    const tipo = formData.get('tipo') as string
    const modo = formData.get('modo') as string

    if (!archivo) {
      return NextResponse.json(
        { error: 'Archivo no proporcionado' },
        { status: 400 }
      )
    }

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de importación no especificado' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = archivo.name.toLowerCase().substring(archivo.name.lastIndexOf('.'))
    
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Extensión no soportada: ${fileExtension}. Use: ${validExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 10MB para importación rápida)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (archivo.size > maxSize) {
      return NextResponse.json(
        { error: `Archivo demasiado grande: ${(archivo.size / 1024 / 1024).toFixed(1)}MB. Máximo: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Crear FormData para enviar al backend
    const backendFormData = new FormData()
    backendFormData.append('archivo', archivo)
    backendFormData.append('tipo', tipo)

    // Enviar al backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/importacion/rapida`, {
      method: 'POST',
      body: backendFormData,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || 'Error en el servidor' },
        { status: response.status }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        modo: 'http',
        procesamientoRapido: true,
      },
      message: 'Importación rápida completada exitosamente',
    })

  } catch (error) {
    console.error('Error en importación rápida:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 