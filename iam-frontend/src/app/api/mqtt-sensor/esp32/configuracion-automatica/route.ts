import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar que el body no esté vacío
    if (!body || Object.keys(body).length === 0) {
      console.error('[ESP32 Config API] Cuerpo de la petición vacío o inválido');
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos de configuración no proporcionados',
          message: 'El cuerpo de la petición está vacío o es inválido'
        },
        { status: 400 }
      );
    }

    // Validar campos requeridos antes de enviar al backend
    const requiredFields = ['deviceName', 'wifiSSID', 'wifiPassword', 'ubicacionId', 'sensores'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.error('[ESP32 Config API] Campos faltantes:', missingFields);
      return NextResponse.json(
        { 
          success: false,
          error: 'Campos requeridos faltantes',
          message: `Los siguientes campos son requeridos: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      );
    }

    // Validar que hay sensores habilitados
    if (!Array.isArray(body.sensores) || body.sensores.filter((s: { enabled: boolean }) => s.enabled).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Sensores inválidos',
          message: 'Debe haber al menos un sensor habilitado'
        },
        { status: 400 }
      );
    }

    console.log('[ESP32 Config API] Enviando configuración al backend:', {
      deviceName: body.deviceName,
      ubicacionId: body.ubicacionId,
      sensoresHabilitados: body.sensores.filter((s: { enabled: boolean }) => s.enabled).length
    });

    // Obtener cookies para autenticación (el sistema usa cookies HTTP-only)
    const cookieHeader = request.headers.get('cookie');
    
    if (!cookieHeader) {
      console.error('[ESP32 Config API] Cookies de autenticación faltantes');
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado',
          message: 'Sesión no encontrada. Por favor, inicia sesión nuevamente.'
        },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/mqtt-sensor/esp32/configuracion-automatica`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'User-Agent': request.headers.get('user-agent') || 'IAM-Frontend/1.0',
      },
      credentials: 'include', // Incluir cookies en la petición
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[ESP32 Config API] Error del backend:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
    } else {
      console.log('[ESP32 Config API] Configuración generada exitosamente');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[ESP32 Config API] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 