import { randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { User, UserRole } from '../src/types';
import { persist } from './persist';

export const SESSION_COOKIE = 'vanguard_session';
const SALT_ROUNDS = 10;
const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 12);

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
    }
  }
}

let ephemeralDevSecret: string | undefined;

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a string of at least 32 characters in production. On Railway: Project → Variables → add JWT_SECRET (openssl rand -hex 32).'
      );
    }
    return secret;
  }
  if (secret) return secret;
  if (!ephemeralDevSecret) {
    ephemeralDevSecret = randomBytes(32).toString('hex');
    console.warn('[auth] JWT_SECRET is unset; using an ephemeral in-memory signing key for this process only.');
  }
  return ephemeralDevSecret;
}

export function demoPassword(): string {
  const fromEnv = process.env.DEMO_PASSWORD;
  if (fromEnv && fromEnv.length >= 8) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEMO_PASSWORD must be set to at least 8 characters in production');
  }
  return 'local-dev-only';
}

export interface AuthTokenClaims {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

export function signToken(user: User): string {
  const claims: AuthTokenClaims = {
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  };
  return jwt.sign(claims, jwtSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyToken(token: string): AuthTokenClaims {
  return jwt.verify(token, jwtSecret()) as AuthTokenClaims;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function ensureSeedPasswords(users: User[]) {
  const password = demoPassword();
  let created = 0;
  for (const user of users) {
    if (!persist.getPasswordHash(user.id)) {
      persist.setPasswordHash(user.id, await hashPassword(password));
      created += 1;
    }
  }
  if (created > 0) {
    console.log(`[auth] Seeded ${created} user password hashes (demo password from DEMO_PASSWORD)`);
  }
}

export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let out = '';
  for (let i = 0; i < 14; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  };
}

export function setSessionCookie(res: Response, token: string) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, token, cookieOptions()));
}

export function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 }));
}

export function readRequestToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  const cookies = parseCookie(req.headers.cookie || '');
  return cookies[SESSION_COOKIE] || null;
}

export function isPlatformUser(user: User | undefined | null): boolean {
  if (!user) return false;
  return (
    user.tenantId === 'platform' ||
    user.role === 'SUPER_ADMIN' ||
    user.role === 'PLATFORM_ADMIN' ||
    user.role === 'SUPPORT_AGENT' ||
    user.role === 'FINANCE_ADMIN' ||
    user.role === 'TECHNICAL_ADMIN'
  );
}

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/demo-accounts',
  '/api/auth/me',
  '/api/ical/',
  '/api/health',
];

export function isPublicApiPath(req: Request): boolean {
  const url = req.path || req.originalUrl.split('?')[0];
  if (url === '/health' || url === '/ready' || url === '/api/health') return true;
  return PUBLIC_API_PREFIXES.some((prefix) => url === prefix || url.startsWith(prefix));
}

export function createAuthMiddleware(getUser: (id: string) => User | undefined) {
  return function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.path.startsWith('/api') || isPublicApiPath(req)) {
      return next();
    }

    const token = readRequestToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const claims = verifyToken(token);
      const user = getUser(claims.sub);
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Account is inactive or no longer exists' });
      }
      req.authUser = user;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  };
}

export function requirePlatform(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser || !isPlatformUser(req.authUser)) {
    return res.status(403).json({ error: 'Platform administrator access required' });
  }
  next();
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || rec.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  rec.count += 1;
  if (rec.count > 8) {
    return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  }
  next();
}
