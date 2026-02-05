import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send resend request to FastAPI
    const fastApiUrl = process.env.FASTAPI_BASE_URL;
    
    if (!fastApiUrl) {
      console.error('FASTAPI_BASE_URL is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${fastApiUrl}/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.detail || 'Failed to resend verification code' },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json(
      { 
        message: 'Verification code resent successfully',
        email_sent: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend verification API error:', error);
    
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