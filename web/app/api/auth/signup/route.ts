import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send request to FastAPI backend
    const fastApiUrl = process.env.FASTAPI_BASE_URL;
    
    if (!fastApiUrl) {
      console.error('FASTAPI_BASE_URL is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${fastApiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        username: email,
        password,
      }),
    });

    const responseData = await response.json();

    console.log('FastAPI response:', responseData);

    if (!response.ok) {
      // Pass through the error from FastAPI
      return NextResponse.json(
        { error: responseData.detail || 'Registration failed' },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json(
      { 
        message: 'Registration successful. Check your email for verification code and enter it below.',
        user: responseData.user || { email, name }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup API error:', error);
    
    if (error instanceof Error) {
      // Handle network errors
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