import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Obtener todas las cookies del request
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/eliminados/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching deleted movement:', error);
    return NextResponse.json(
      { error: 'Error al obtener el movimiento eliminado' },
      { status: 500 }
    );
  }
} 