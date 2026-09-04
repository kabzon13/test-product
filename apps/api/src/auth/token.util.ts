import { createHash, randomBytes } from 'node:crypto';

/** Opaque token: 32 случайных байта, base64url. В БД хранится только sha256. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
