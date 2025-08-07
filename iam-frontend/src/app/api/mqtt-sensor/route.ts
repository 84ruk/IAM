import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/mqtt-sensor', '');
    
    const response = await fetch(`${BACKEND_URL}/mqtt-sensor${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in mqtt-sensor API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/mqtt-sensor', '');
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/mqtt-sensor${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in mqtt-sensor API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/mqtt-sensor', '');
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/mqtt-sensor${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in mqtt-sensor API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/mqtt-sensor', '');
    
    const response = await fetch(`${BACKEND_URL}/mqtt-sensor${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries()),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in mqtt-sensor API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 