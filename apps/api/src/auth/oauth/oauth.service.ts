import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DB, type Db } from '../../db/db.module';
import { users } from '../../db/schema';

@Injectable()
export class OAuthService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Find-or-create с account linking:
   * 1. есть user с этим provider+id → он
   * 2. есть user с этим email → линкуем провайдера
   * 3. иначе создаём (email от провайдера считаем подтверждённым)
   */
  async loginWithProvider(
    provider: string,
    providerAccountId: string,
    email: string,
  ): Promise<{ id: string; email: string }> {
    const normalized = email.trim().toLowerCase();

    const byProvider = await this.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.provider, provider), eq(users.providerAccountId, providerAccountId)))
      .limit(1);
    if (byProvider[0]) return byProvider[0];

    const byEmail = await this.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
    if (byEmail[0]) {
      await this.db
        .update(users)
        .set({
          provider,
          providerAccountId,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail[0].id));
      return byEmail[0];
    }

    const created = await this.db
      .insert(users)
      .values({
        email: normalized,
        provider,
        providerAccountId,
        emailVerifiedAt: new Date(),
      })
      .returning({ id: users.id, email: users.email });
    const user = created[0];
    if (!user) throw new Error('failed to create oauth user');
    return user;
  }
}
