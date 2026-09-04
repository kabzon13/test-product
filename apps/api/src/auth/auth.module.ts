import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';

import { AuthController } from './auth.controller';
import { SessionGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { GoogleOAuthController } from './oauth/google.controller';
import { OAuthService } from './oauth/oauth.service';
import { SessionService } from './session.service';

@Module({
  imports: [EmailModule],
  controllers: [
    AuthController,
    GoogleOAuthController,
  ],
  providers: [
    AuthService,
    SessionService,
    SessionGuard,
    OAuthService,
  ],
  exports: [SessionService, SessionGuard],
})
export class AuthModule {}
