import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const archivo = formData.get('archivo') as File
    const tipo = formData.get('tipo') as string

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

    // Validar tamaño del archivo (máximo 50MB para importación unificada)
    const maxSize = 50 * 1024 * 1024 // 50MB
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

    // Agregar propiedades booleanas como strings
    const propiedadesBooleanas = [
      'sobrescribirExistentes',
      'validarSolo', 
      'notificarEmail'
    ]

    propiedadesBooleanas.forEach(propiedad => {
      const valor = formData.get(propiedad)
      if (valor !== null) {
        // Convertir a string boolean - FormDataEntryValue puede ser string o File
        const stringValue = valor.toString()
        const boolValue = stringValue === 'true' || stringValue === '1'
        backendFormData.append(propiedad, boolValue.toString())
      }
    })

    // Agregar propiedades de string
    const propiedadesString = [
      'emailNotificacion'
    ]

    propiedadesString.forEach(propiedad => {
      const valor = formData.get(propiedad)
      if (valor !== null && valor !== '') {
        backendFormData.append(propiedad, valor.toString())
      }
    })

    // Agregar configuraciones específicas como JSON strings
    const configuraciones = [
      'configuracionProductos',
      'configuracionProveedores', 
      'configuracionMovimientos'
    ]

    configuraciones.forEach(config => {
      const valor = formData.get(config)
      if (valor !== null) {
        try {
          // Si es un string JSON, parsearlo y volver a stringificar
          const parsed = typeof valor === 'string' ? JSON.parse(valor) : valor
          backendFormData.append(config, JSON.stringify(parsed))
        } catch (error) {
          // Si no es JSON válido, enviarlo como string
          backendFormData.append(config, valor.toString())
        }
      }
    })

    // Obtener todas las cookies del request
    const cookies = request.headers.get('cookie') || ''

    // Enviar al backend con las cookies de autenticación
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/importacion/unificada`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        'Cookie': cookies,
        'X-Requested-With': 'XMLHttpRequest',
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || 'Error en importación unificada' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data,
      message: 'Importación unificada iniciada correctamente'
    })

  } catch (error) {
    console.error('Error en importación unificada:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 