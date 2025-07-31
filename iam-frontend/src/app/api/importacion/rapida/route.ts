import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const archivo = formData.get('archivo') as File
    const tipo = formData.get('tipo') as string

    if (!archivo) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Archivo no proporcionado',
          message: 'Por favor selecciona un archivo para importar'
        },
        { status: 400 }
      )
    }

    if (!tipo) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de importación no especificado',
          message: 'Debes especificar el tipo de importación'
        },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = archivo.name.toLowerCase().substring(archivo.name.lastIndexOf('.'))
    
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Extensión no soportada: ${fileExtension}`,
          message: `El archivo debe tener una de estas extensiones: ${validExtensions.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 10MB para importación rápida)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (archivo.size > maxSize) {
      return NextResponse.json(
        { 
          success: false,
          error: `Archivo demasiado grande: ${(archivo.size / 1024 / 1024).toFixed(1)}MB`,
          message: `El archivo es demasiado grande. Máximo permitido: ${maxSize / 1024 / 1024}MB`
        },
        { status: 400 }
      )
    }

    // Crear FormData para enviar al backend
    const backendFormData = new FormData()
    backendFormData.append('archivo', archivo)
    backendFormData.append('tipo', tipo)

    // Agregar opciones adicionales si existen
    const opciones = ['descripcion', 'estrategiaDuplicados', 'validarSolo', 'generarReporteDetallado']
    opciones.forEach(opcion => {
      const valor = formData.get(opcion)
      if (valor !== null) {
        backendFormData.append(opcion, valor.toString())
      }
    })

    // Obtener todas las cookies del request
    const cookies = request.headers.get('cookie') || ''

    // Enviar al backend con las cookies de autenticación
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/importacion/rapida`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        'Cookie': cookies,
        'X-Requested-With': 'XMLHttpRequest',
      }
    })

    const responseData = await response.json()

    if (!response.ok) {
      // Manejar errores del backend de forma más detallada
      const errorMessage = responseData.message || responseData.error || 'Error en importación rápida'
      const errorDetails = responseData.details || responseData.errores || []
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        message: errorMessage,
        details: errorDetails,
        statusCode: response.status
      }, { status: response.status })
    }

    // Procesar respuesta exitosa del backend
    const data = responseData

    // Debug: Log de la respuesta del backend
    console.log('🔍 Respuesta del backend:', JSON.stringify(data, null, 2))
    console.log('🔍 Errores en data.data:', data.data?.errores)
    console.log('🔍 Tipo de errores:', typeof data.data?.errores, Array.isArray(data.data?.errores))

    // Estructura de respuesta unificada y compatible
    return NextResponse.json({
      success: data.success !== false, // Asegurar que success sea boolean
      data: {
        ...data.data,
        // Asegurar que todos los campos estén presentes
        registrosProcesados: data.data?.registrosProcesados || 0,
        registrosExitosos: data.data?.registrosExitosos || 0,
        registrosConError: data.data?.registrosConError || 0,
        errores: data.data?.errores || [],
        correcciones: data.data?.correcciones || [],
        registrosExitososDetalle: data.data?.registrosExitososDetalle || [], // Nueva propiedad
        resumen: data.data?.resumen || {},
        archivoErrores: data.data?.archivoErrores || null,
        tiempoProcesamiento: data.data?.tiempoProcesamiento || 0
      },
      message: data.message || 'Importación completada',
      hasErrors: (data.data?.registrosConError || 0) > 0,
      errorCount: data.data?.registrosConError || 0,
      successCount: data.data?.registrosExitosos || 0,
      errorFile: data.data?.archivoErrores || null,
      
      // Información de detección automática
      tipoDetectado: data.tipoDetectado || null,
      tipoUsado: data.tipoUsado || tipo,
      confianzaDetectada: data.confianzaDetectada || 0,
      mensajeDeteccion: data.mensajeDeteccion || '',
      
      // Campos adicionales para compatibilidad
      registrosProcesados: data.data?.registrosProcesados || 0,
      registrosExitosos: data.data?.registrosExitosos || 0,
      registrosConError: data.data?.registrosConError || 0,
      errores: data.data?.errores || [],
      correcciones: data.data?.correcciones || [],
      registrosExitososDetalle: data.data?.registrosExitososDetalle || [], // Nueva propiedad
      resumen: data.data?.resumen || {},
      archivoErrores: data.data?.archivoErrores || null
    })

  } catch (error) {
    console.error('Error en importación rápida:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: 'Error interno del servidor durante la importación',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 