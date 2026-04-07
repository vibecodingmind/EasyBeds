import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthDetailed, type JwtPayload } from '@/lib/auth';

// Routes that bypass authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/seed',
  '/api/public/',
  '/api/portal/',
  '/api/checkin/',
  '/api/webhooks/stripe',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public routes through without auth
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Verify JWT from Authorization header
  const { payload, error, expired } = verifyAuthDetailed(request);

  if (!payload) {
    const status = expired ? 401 : 401;
    return NextResponse.json(
      {
        success: false,
        error: error || 'Authentication required.',
        code: expired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
      },
      { status }
    );
  }

  // Clone request headers and add user info for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-name', payload.name);
  requestHeaders.set('x-user-role', payload.role || '');
  requestHeaders.set('x-platform-role', payload.platformRole || '');
  if (payload.hotelId) {
    requestHeaders.set('x-hotel-id', payload.hotelId);
  }

  // Forward the modified request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
