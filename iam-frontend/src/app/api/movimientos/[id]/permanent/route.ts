import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Obtener todas las cookies del request
    const cookies = request.headers.get('cookie') || ''
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/${id}/permanent`, {
      method: 'DELETE',
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
    console.error('Error permanently deleting movement:', error);
    return NextResponse.json(
      { error: 'Error al eliminar permanentemente el movimiento' },
      { status: 500 }
    );
  }
} 