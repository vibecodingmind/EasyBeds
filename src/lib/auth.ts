import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'easybeds-dev-secret-key-2026';

// JWT access token expires in 24 hours
const JWT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  hotelId?: string;
  role?: string;        // hotel-level role (owner, manager, staff, housekeeping)
  platformRole?: string; // platform-level role (admin, user)
  iat?: number;
  exp?: number;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

export function signJwt(payload: JwtPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Date.now();
  const body = base64UrlEncode(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + JWT_EXPIRATION_MS,
  }));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtError';
  }
}

export function verifyJwt(token: string): JwtPayload {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new JwtError('Invalid token format');
    }
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) {
      throw new JwtError('Invalid token signature');
    }
    const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload;

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      throw new JwtError('Token has expired. Please log in again.');
    }

    return payload;
  } catch (error) {
    if (error instanceof JwtError) {
      throw error;
    }
    throw new JwtError('Invalid token');
  }
}

// ── Password hashing with bcryptjs ──────────────────────────────────────────
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // If hash looks like an old SHA-256 hash (64 hex chars, no $ prefix), use legacy verification
  if (hash && !hash.startsWith('$') && /^[a-f0-9]{64}$/i.test(hash)) {
    const salt = 'easybeds-salt';
    const legacyHash = crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex');
    return legacyHash === hash;
  }
  return bcrypt.compare(password, hash);
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

/**
 * Enhanced auth verification that returns detailed error info.
 * Use this in middleware and route handlers that need to distinguish
 * between expired and invalid tokens.
 */
export function verifyAuthDetailed(request: NextRequest): {
  payload: JwtPayload | null;
  error: string | null;
  expired: boolean;
} {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { payload: null, error: 'Missing or invalid Authorization header', expired: false };
    }
    const token = authHeader.slice(7);
    const payload = verifyJwt(token);
    return { payload, error: null, expired: false };
  } catch (error) {
    if (error instanceof JwtError) {
      const expired = error.message.includes('expired');
      return { payload: null, error: error.message, expired };
    }
    return { payload: null, error: 'Invalid token', expired: false };
  }
}

export type { JwtPayload };
