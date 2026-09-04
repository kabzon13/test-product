import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DB, type Db } from '../db/db.module';
import { webhookEvents } from '../db/schema';

/**
 * Приём внешних событий: хранение + идемпотентность.
 * Событие с тем же (source, externalId) обрабатывается ровно один раз —
 * дубликаты отсекаются уникальным индексом.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(@Inject(DB) private readonly db: Db) {}

  async handleOnce(
    source: string,
    externalId: string,
    type: string,
    payload: object,
    handler: () => Promise<void>,
  ): Promise<{ duplicate: boolean }> {
    const inserted = await this.db
      .insert(webhookEvents)
      .values({ source, externalId, type, payload })
      .onConflictDoNothing({ target: [webhookEvents.source, webhookEvents.externalId] })
      .returning({ id: webhookEvents.id });

    const event = inserted[0];
    if (!event) {
      this.logger.log({ source, externalId }, 'duplicate webhook, skipped');
      return { duplicate: true };
    }

    try {
      await handler();
      await this.db
        .update(webhookEvents)
        .set({ status: 'processed', processedAt: new Date() })
        .where(eq(webhookEvents.id, event.id));
    } catch (err) {
      await this.db
        .update(webhookEvents)
        .set({ status: 'failed', error: err instanceof Error ? err.message : String(err) })
        .where(eq(webhookEvents.id, event.id));
      throw err;
    }
    return { duplicate: false };
  }
}
