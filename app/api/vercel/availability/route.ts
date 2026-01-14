import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/vercel/availability
 * 
 * Get availability for a specific domain
 * 
 * Query parameters:
 * - domain: string (required) - The domain name to check
 * - token: string (required) - Vercel API token
 * - teamId: string (optional) - Vercel team ID
 * 
 * Returns: { available: boolean }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  const token = searchParams.get('token');
  const teamId = searchParams.get('teamId');

  if (!domain || !token) {
    return NextResponse.json(
      { error: 'Domain and token are required' },
      { status: 400 }
    );
  }

  try {
    // Build Vercel API URL with optional teamId query parameter
    let apiUrl = `https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/availability`;
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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      
      return NextResponse.json(
        { 
          error: `Vercel API error: ${response.statusText}`,
          details: errorData 
        },
        { status: response.status }
      );
    }

    // Vercel API returns: { available: boolean }
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
