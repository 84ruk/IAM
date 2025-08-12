import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const ubicacionId = searchParams.get('ubicacionId');
    
    // Construir URL del backend
    let backendUrl = `${BACKEND_URL}/mqtt-sensor/sensores/listar`;
    if (ubicacionId) {
      backendUrl += `?ubicacionId=${ubicacionId}`;
    }

    // Obtener cookies del request
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      console.error('[Sensores API] Cookies de autenticación faltantes');
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado',
          message: 'Sesión no encontrada. Por favor, inicia sesión nuevamente.'
        },
        { status: 401 }
      );
    }

    console.log('[Sensores API] Enviando request al backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'User-Agent': request.headers.get('user-agent') || 'IAM-Frontend/1.0',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Sensores API] Error del backend:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
    } else {
      console.log('[Sensores API] Sensores obtenidos exitosamente:', {
        count: Array.isArray(data) ? data.length : 'N/A',
        ubicacionId: ubicacionId || 'Todas'
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Sensores API] Error inesperado:', error);
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



