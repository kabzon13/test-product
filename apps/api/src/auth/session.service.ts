import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, lt } from 'drizzle-orm';

import { DB, type Db } from '../db/db.module';
import { sessions, users } from '../db/schema';
import { env } from '../env';

import { generateToken, hashToken } from './token.util';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
}

@Injectable()
export class SessionService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async create(
    userId: string,
    meta: { ip?: string | undefined; userAgent?: string | undefined },
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * DAY_MS);
    await this.db.insert(sessions).values({
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
    return { token, expiresAt };
  }

  async validate(token: string): Promise<SessionUser | null> {
    const rows = await this.db
      .select({
        sessionId: sessions.id,
        lastUsedAt: sessions.lastUsedAt,
        id: users.id,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // не пишем last_used_at на каждый запрос — раз в час достаточно
    if (Date.now() - row.lastUsedAt.getTime() > 60 * 60 * 1000) {
      await this.db
        .update(sessions)
        .set({ lastUsedAt: new Date() })
        .where(eq(sessions.id, row.sessionId));
    }
    return { id: row.id, email: row.email, emailVerifiedAt: row.emailVerifiedAt };
  }

  async destroy(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }

  async destroyAllForUser(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async pruneExpired(): Promise<void> {
    await this.db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }
}
