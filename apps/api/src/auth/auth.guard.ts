import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { SESSION_COOKIE } from './cookie';
import { SessionService, type SessionUser } from './session.service';

export type AuthedRequest = Request & { user: SessionUser; sessionToken: string };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = (req.cookies as Record<string, string | undefined>)[SESSION_COOKIE];
    if (!token) throw new UnauthorizedException();
    const user = await this.sessions.validate(token);
    if (!user) throw new UnauthorizedException();
    req.user = user;
    req.sessionToken = token;
    return true;
  }
}
