import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const publicPaths = ['/signin', '/signup', '/', '/api/auth'];
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
  
  // Get token from cookies - check both httpOnly and non-httpOnly cookies
  const token = request.cookies.get('auth-token')?.value || 
                request.cookies.get('access_token_client')?.value;
  
  console.log(`Middleware: ${path}, isPublic: ${isPublicPath}, hasToken: ${!!token}`);
  
  // If trying to access protected route without token
  if (!isPublicPath && !token && !path.startsWith('/_next')) {
    console.log(`Redirecting to signin from ${path}`);
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', encodeURIComponent(path));
    return NextResponse.redirect(signinUrl);
  }
  
  // If trying to access auth pages with token
  if ((path === '/signin' || path === '/signup') && token) {
    console.log(`Already authenticated, redirecting from ${path} to dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/signin',
    '/signup',
  ],
};