import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/apininjas/availability
 * 
 * Get availability for a specific domain using API Ninjas
 * 
 * Query parameters:
 * - domain: string (required) - The domain name to check
 * 
 * Returns: { domain: string, available: boolean, creation_date?: number, registrar?: string }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  const apiKey = process.env.API_NINJAS_KEY;

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain is required' },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API Ninjas key is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/domain?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          'X-Api-Key': apiKey,
        },
      }
    );

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
          error: `API Ninjas error: ${response.statusText}`,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    // API Ninjas returns: { domain: string, available: boolean, creation_date?: number, registrar?: string }
    return NextResponse.json({
      available: data.available === true,
      domain: data.domain,
    });
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
