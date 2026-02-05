import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    const fastApiUrl = process.env.FASTAPI_BASE_URL;
    
    if (!fastApiUrl) {
      console.error('FASTAPI_BASE_URL is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${fastApiUrl}/current-user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: response.status }
      );
    }

    const userData = await response.json();
    
    return NextResponse.json(userData, { status: 200 });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}