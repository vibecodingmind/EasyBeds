import crypto from 'crypto';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'easybeds-dev-secret-key-2026';

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  hotelId?: string;
  role?: string;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

export function signJwt(payload: JwtPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: Date.now() }));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(base64UrlDecode(body));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = 'easybeds-salt';
  return crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function verifyAuth(request: NextRequest): Promise<JwtPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    return verifyJwt(token);
  } catch {
    return null;
  }
}
