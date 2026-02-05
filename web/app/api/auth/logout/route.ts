import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );
  
  response.cookies.delete('auth-token');
  response.cookies.delete('access_token_client');
  
  response.cookies.set({
    name: 'auth-token',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  response.cookies.set({
    name: 'access_token_client',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}