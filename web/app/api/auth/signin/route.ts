import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Username or email may be used as the identifier; only basic presence is validated here.
    // Format-specific validation happens against the identifier's type in the backend.

    const fastApiUrl = process.env.FASTAPI_BASE_URL;
    
    if (!fastApiUrl) {
      console.error('FASTAPI_BASE_URL is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${fastApiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.detail || 'Login failed' },
        { status: response.status }
      );
    }

    // Return JSON response with token
    const apiResponse = NextResponse.json({
      message: 'Login successful',
      access_token: responseData.access_token,
      user: responseData.user || {
        id: 0,
        username: username,
        name: username.split('@')[0],
        email: username,
        email_verified: true,
        created_at: new Date().toISOString()
      }
    }, { status: 200 });

    // Set cookies
    apiResponse.cookies.set({
      name: 'auth-token',
      value: responseData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // Non-httpOnly cookie for client-side access
    apiResponse.cookies.set({
      name: 'access_token_client',
      value: responseData.access_token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return apiResponse;

  } catch (error) {
    console.error('Signin API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('NetworkError')) {
        return NextResponse.json(
          { error: 'Unable to connect to the server. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}