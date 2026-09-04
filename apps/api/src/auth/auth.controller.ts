import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { SessionGuard, type AuthedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { clearCookieOptions, SESSION_COOKIE, sessionCookieOptions } from './cookie';
import { CurrentUser } from './current-user.decorator';
import {
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  UserResponse,
  VerifyEmailDto,
} from './dto';
import { SessionService, type SessionUser } from './session.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ operationId: 'register' })
  async register(@Body() dto: RegisterDto): Promise<{ id: string; email: string }> {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ operationId: 'login' })
  @ApiOkResponse({ type: UserResponse })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string; email: string }> {
    const { token, expiresAt, user } = await this.auth.login(dto.email, dto.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'logout' })
  async logout(
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.sessions.destroy(req.sessionToken);
    res.clearCookie(SESSION_COOKIE, clearCookieOptions());
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ operationId: 'me' })
  @ApiOkResponse({ type: UserResponse })
  me(@CurrentUser() user: SessionUser): SessionUser {
    return user;
  }

  @Post('verify-email')
  @HttpCode(204)
  @ApiOperation({ operationId: 'verifyEmail' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.auth.verifyEmail(dto.token);
  }

  @Post('request-password-reset')
  @HttpCode(204)
  @ApiOperation({ operationId: 'requestPasswordReset' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto): Promise<void> {
    await this.auth.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(204)
  @ApiOperation({ operationId: 'resetPassword' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }
}
