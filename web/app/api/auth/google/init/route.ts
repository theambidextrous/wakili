import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('Missing Google OAuth configuration');
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in .env.local" },
      { status: 501 }
    );
  }

  // Get the referrer to know if it's signin or signup
  const referrer = request.headers.get('referer') || '';
  const isSignup = referrer.includes('/signup');
  
  // Create state parameter to maintain context
  const state = JSON.stringify({
    isSignup,
    timestamp: Date.now(),
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: Buffer.from(state).toString('base64'), // Encode state
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}