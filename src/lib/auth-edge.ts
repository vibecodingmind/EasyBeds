/**
 * Edge Runtime compatible JWT verification using Web Crypto API.
 * This module is used by middleware.ts which runs in the Edge Runtime
 * where Node.js modules (crypto, bcryptjs) are not available.
 */

const JWT_SECRET = process.env.JWT_SECRET || 'easybeds-dev-secret-key-2026';

// JWT expiration: 24 hours
const JWT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  hotelId?: string;
  role?: string;
  platformRole?: string;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const binStr = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  const binStr = atob(padded);
  const bytes = Uint8Array.from(binStr, (c) => c.codePointAt(0)!);
  return new TextDecoder().decode(bytes);
}

async function createHmacSha256Signature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const binStr = Array.from(new Uint8Array(signature), (b) => String.fromCodePoint(b)).join('');
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyJwtEdge(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  const [header, body, signature] = parts;

  // Verify signature using Web Crypto
  const expectedSig = await createHmacSha256Signature(`${header}.${body}`, JWT_SECRET);
  if (signature !== expectedSig) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload;

  // Check expiration
  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Token has expired. Please log in again.');
  }

  return payload;
}

export type { JwtPayload };
