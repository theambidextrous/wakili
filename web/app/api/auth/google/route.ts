import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI." },
      { status: 501 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
