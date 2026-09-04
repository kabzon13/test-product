import type { NextFunction, Request, Response } from 'express';

import { env } from '../env';

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Вебхуки приходят server-to-server и не несут браузерного Origin.
const EXEMPT_PREFIXES: string[] = [
  '/api/v1/billing/webhook',
];

/**
 * CSRF-защита: SameSite=Lax на cookie + проверка Origin на unsafe-методах.
 * Запросы без Origin (curl, server-to-server) пропускаются: у них нет
 * амбиентных куки-кредов из чужого сайта.
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!UNSAFE.has(req.method)) {
    next();
    return;
  }
  if (EXEMPT_PREFIXES.some((p) => req.path.startsWith(p))) {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }
  const allowed = new URL(env.PUBLIC_URL).origin;
  if (origin !== allowed) {
    res.status(403).json({ message: 'Origin not allowed' });
    return;
  }
  next();
}
