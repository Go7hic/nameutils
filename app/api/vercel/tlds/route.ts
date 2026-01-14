import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const teamId = searchParams.get('teamId');

  if (!token) {
    return NextResponse.json(
      { error: 'Vercel token is required' },
      { status: 400 }
    );
  }

  try {
    // Build Vercel API URL
    let apiUrl = 'https://api.vercel.com/v1/registrar/tlds/supported';
    if (teamId) {
      apiUrl += `?teamId=${encodeURIComponent(teamId)}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Vercel API error: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
