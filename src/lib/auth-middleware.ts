import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyJwt, JwtError, type JwtPayload } from '@/lib/auth';

/**
 * Require authentication — returns user payload or a 401 response.
 * Use at the top of any protected API route handler.
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAuth(request);
 *   if (auth.error) return auth.error;
 *   // auth.payload.userId, auth.payload.role, etc. are available
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<
  | { payload: JwtPayload; error: null }
  | { payload: null; error: NextResponse }
> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        payload: null,
        error: NextResponse.json(
          {
            success: false,
            error: 'Authentication required. Please provide a valid Bearer token.',
            code: 'UNAUTHORIZED',
          },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    return { payload, error: null };
  } catch (error) {
    if (error instanceof JwtError) {
      const expired = error.message.includes('expired');
      return {
        payload: null,
        error: NextResponse.json(
          {
            success: false,
            error: error.message,
            code: expired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
          },
          { status: 401 }
        ),
      };
    }
    return {
      payload: null,
      error: NextResponse.json(
        { success: false, error: 'Invalid token.', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Optional authentication — returns user payload if authenticated, null if not.
 * Useful for routes that work for both authenticated and anonymous users.
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await optionalAuth(request);
 *   const userId = auth?.userId; // string | undefined
 * }
 * ```
 */
export async function optionalAuth(
  request: NextRequest
): Promise<JwtPayload | null> {
  return verifyAuth(request);
}

/**
 * Require specific roles — combines requireAuth with role checking.
 * Returns user payload if authenticated AND has one of the required roles.
 *
 * @param roles - Array of allowed roles (e.g., ['owner', 'manager', 'admin'])
 *
 * @example
 * ```ts
 * export async function DELETE(request: NextRequest) {
 *   const auth = await requireRole(request, ['owner', 'manager']);
 *   if (auth.error) return auth.error;
 *   // auth.payload.userId is available and role is owner/manager
 * }
 * ```
 */
export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<
  | { payload: JwtPayload; error: null }
  | { payload: null; error: NextResponse }
> {
  // First check authentication
  const auth = await requireAuth(request);
  if (auth.error) return auth;

  // Check if user has one of the required roles
  const userRole = auth.payload.role;
  const platformRole = auth.payload.platformRole;

  // Platform admins bypass hotel-level role checks
  if (platformRole === 'admin' && roles.includes('admin')) {
    return auth;
  }

  if (!userRole || !roles.includes(userRole)) {
    return {
      payload: null,
      error: NextResponse.json(
        {
          success: false,
          error: `Insufficient permissions. Required role: ${roles.join(' or ')}.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Helper to read user info injected by Next.js middleware.
 * These headers are set by src/middleware.ts for downstream use.
 */
export function getAuthHeaders(request: NextRequest): {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  platformRole: string | null;
  hotelId: string | null;
} {
  return {
    userId: request.headers.get('x-user-id'),
    userEmail: request.headers.get('x-user-email'),
    userName: request.headers.get('x-user-name'),
    userRole: request.headers.get('x-user-role'),
    platformRole: request.headers.get('x-platform-role'),
    hotelId: request.headers.get('x-hotel-id'),
  };
}
