import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { and, eq, gt, isNull } from 'drizzle-orm';

import { DB, type Db } from '../db/db.module';
import { authTokens, users } from '../db/schema';
import { EmailService } from '../email/email.service';
import { env } from '../env';

import { SessionService } from './session.service';
import { generateToken, hashToken } from './token.util';

const HOUR_MS = 60 * 60 * 1000;
const TOKEN_TTL: Record<string, number> = {
  email_verify: 24 * HOUR_MS,
  password_reset: 1 * HOUR_MS,
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly sessions: SessionService,
    private readonly email: EmailService,
  ) {}

  async register(emailAddr: string, password: string): Promise<{ id: string; email: string }> {
    const normalized = emailAddr.trim().toLowerCase();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const inserted = await this.db
      .insert(users)
      .values({ email: normalized, passwordHash })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id, email: users.email });

    const user = inserted[0];
    if (!user) throw new ConflictException('Email already registered');

    const token = await this.issueAuthToken(user.id, 'email_verify');
    await this.email.send({
      to: normalized,
      ...this.email.templates.verifyEmail(`${env.PUBLIC_URL}/verify-email?token=${token}`),
    });
    return user;
  }

  async login(
    emailAddr: string,
    password: string,
    meta: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<{ token: string; expiresAt: Date; user: { id: string; email: string } }> {
    const normalized = emailAddr.trim().toLowerCase();
    const found = await this.db.select().from(users).where(eq(users.email, normalized)).limit(1);
    const user = found[0];
    // при неизвестном email всё равно считаем argon2 — не палим существование аккаунта таймингом
    const hash = user?.passwordHash ?? (await argon2.hash('timing-equalizer'));
    const ok = await argon2.verify(hash, password).catch(() => false);
    if (!user || !user.passwordHash || !ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const session = await this.sessions.create(user.id, meta);
    return { ...session, user: { id: user.id, email: user.email } };
  }

  async verifyEmail(token: string): Promise<void> {
    const row = await this.consumeAuthToken(token, 'email_verify');
    await this.db
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, row.userId));
  }

  async requestPasswordReset(emailAddr: string): Promise<void> {
    const normalized = emailAddr.trim().toLowerCase();
    const found = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
    const user = found[0];
    // ответ всегда 204 — существование аккаунта не раскрываем
    if (!user) return;
    const token = await this.issueAuthToken(user.id, 'password_reset');
    await this.email.send({
      to: normalized,
      ...this.email.templates.resetPassword(`${env.PUBLIC_URL}/reset-password?token=${token}`),
    });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const row = await this.consumeAuthToken(token, 'password_reset');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, row.userId));
    // смена пароля инвалидирует все сессии
    await this.sessions.destroyAllForUser(row.userId);
  }

  private async issueAuthToken(userId: string, type: keyof typeof TOKEN_TTL): Promise<string> {
    const token = generateToken();
    await this.db.insert(authTokens).values({
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + (TOKEN_TTL[type] ?? HOUR_MS)),
    });
    return token;
  }

  private async consumeAuthToken(token: string, type: string): Promise<{ userId: string }> {
    const updated = await this.db
      .update(authTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(authTokens.tokenHash, hashToken(token)),
          eq(authTokens.type, type),
          isNull(authTokens.usedAt),
          gt(authTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: authTokens.userId });
    const row = updated[0];
    if (!row) throw new BadRequestException('Token is invalid, expired or already used');
    return row;
  }
}
