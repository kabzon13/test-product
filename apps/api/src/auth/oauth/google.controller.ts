import { BadRequestException, Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { env } from '../../env';
import { COOKIE_SECURE, SESSION_COOKIE, sessionCookieOptions } from '../cookie';
import { SessionService } from '../session.service';
import { generateToken } from '../token.util';

import { OAuthService } from './oauth.service';

const STATE_COOKIE = 'oauth_state';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

@ApiExcludeController()
@Controller('auth/oauth/google')
export class GoogleOAuthController {
  constructor(
    private readonly oauth: OAuthService,
    private readonly sessions: SessionService,
  ) {}

  private redirectUri(): string {
    return `${env.PUBLIC_URL}/api/v1/auth/oauth/google/callback`;
  }

  @Get()
  start(@Res() res: Response): void {
    if (!env.GOOGLE_CLIENT_ID) throw new BadRequestException('Google OAuth is not configured');
    const state = generateToken();
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/v1/auth/oauth',
    });
    const url = new URL(AUTH_URL);
    url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', this.redirectUri());
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    const savedState = (req.cookies as Record<string, string | undefined>)[STATE_COOKIE];
    if (!code || !state || !savedState || state !== savedState) {
      throw new BadRequestException('Invalid OAuth state');
    }
    res.clearCookie(STATE_COOKIE, { path: '/api/v1/auth/oauth' });

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: this.redirectUri(),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) throw new BadRequestException('OAuth code exchange failed');
    const tokens = (await tokenRes.json()) as { access_token: string };

    const infoRes = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) throw new BadRequestException('OAuth userinfo failed');
    const info = (await infoRes.json()) as { sub: string; email?: string };
    if (!info.email) throw new BadRequestException('Google account has no email');

    const user = await this.oauth.loginWithProvider('google', info.sub, info.email);
    const session = await this.sessions.create(user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    res.redirect('/');
  }
}
