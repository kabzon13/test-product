import type { CookieOptions } from 'express';

import { env } from '../env';

// Secure по умолчанию в production; dev-docker (http) выключает через COOKIE_SECURE=false.
export const COOKIE_SECURE = env.COOKIE_SECURE ?? env.NODE_ENV === 'production';

// __Host- префикс требует Secure и работает только по HTTPS.
export const SESSION_COOKIE = COOKIE_SECURE ? '__Host-session' : 'session';

export function sessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  };
}

export function clearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  };
}
