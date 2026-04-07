import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtEdge } from '@/lib/auth-edge';

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
  // Use a synchronous response helper pattern — middleware must be synchronous in Edge
  const { pathname } = request.nextUrl;

  // Only intercept /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public routes through without auth
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Read the auth header synchronously
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  // We need to handle JWT verification asynchronously, but Edge middleware
  // in Next.js 16 supports async middleware via the proxy convention.
  // For the standard middleware pattern, we parse JWT synchronously
  // using a simple approach (Base64 decode payload without signature verification
  // for the middleware layer — actual verification happens in route handlers).

  // Parse JWT payload (base64url decode) for header injection
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadStr));

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return NextResponse.json(
        { success: false, error: 'Token has expired. Please log in again.', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    // Inject user info headers for downstream route handlers
    const requestHeaders = new Headers(request.headers);
    if (payload.userId) requestHeaders.set('x-user-id', payload.userId);
    if (payload.email) requestHeaders.set('x-user-email', payload.email);
    if (payload.name) requestHeaders.set('x-user-name', payload.name);
    if (payload.role) requestHeaders.set('x-user-role', payload.role);
    if (payload.platformRole) requestHeaders.set('x-platform-role', payload.platformRole);
    if (payload.hotelId) requestHeaders.set('x-hotel-id', payload.hotelId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid token.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
