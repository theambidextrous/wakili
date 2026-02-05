// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/signin?error=google_auth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/signin?error=no_code', request.url));
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/signin?error=token_exchange_failed', request.url));
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error('User info error:', userInfo);
      return NextResponse.redirect(new URL('/signin?error=user_info_failed', request.url));
    }

    // Call your FastAPI backend with the Google ID token
    const fastApiUrl = process.env.FASTAPI_BASE_URL;
    
    if (!fastApiUrl) {
      console.error('FASTAPI_BASE_URL is not configured');
      return NextResponse.redirect(new URL('/signin?error=server_config', request.url));
    }

    const backendResponse = await fetch(`${fastApiUrl}/social-login/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: tokenData.id_token || tokenData.access_token,
      }),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error('Backend social login error:', backendData);
      return NextResponse.redirect(new URL('/signin?error=backend_login_failed', request.url));
    }

    // Instead of redirecting directly to dashboard, redirect to AuthCallbackPage
    // with the token and user info as query parameters
    const authCallbackUrl = new URL('/auth/callback', request.url);
    
    // Add the token and user info to the URL
    authCallbackUrl.searchParams.set('access_token', backendData.access_token);
    authCallbackUrl.searchParams.set('user', JSON.stringify(backendData.user));
    authCallbackUrl.searchParams.set('token_type', backendData.token_type || 'bearer');
    
    // Also set cookies for middleware/auth checks
    const response = NextResponse.redirect(authCallbackUrl);
    
    response.cookies.set({
      name: 'auth-token',
      value: backendData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set({
      name: 'access_token_client',
      value: backendData.access_token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/signin?error=unexpected', request.url));
  }
}