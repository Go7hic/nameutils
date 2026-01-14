import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/rapidapi/availability
 * 
 * Get availability for a specific domain using RapidAPI Domains API
 * 
 * Query parameters:
 * - domain: string (required) - The domain name to check
 * 
 * Returns: { available: boolean }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST || 'domains-api.p.rapidapi.com';

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain is required' },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'RapidAPI key is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://${apiHost}/domains/${encodeURIComponent(domain)}?mode=standard`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
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
          error: `RapidAPI error: ${response.statusText}`,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // RapidAPI Domains API returns: { availability: "available" | "taken" | ... }
    let isAvailable = false;
    
    if (data.availability === 'available') {
      isAvailable = true;
    } else if (data.availability === 'taken' || data.availability === 'registered' || data.availability === 'unavailable') {
      isAvailable = false;
    } else if (typeof data.available === 'boolean') {
      // Fallback for other possible formats
      isAvailable = data.available;
    }

    return NextResponse.json({
      available: isAvailable,
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
