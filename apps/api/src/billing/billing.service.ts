import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

import { env } from '../env';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(private readonly webhooks: WebhooksService) {
    this.stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    return this.stripe;
  }

  async createCheckoutSession(userId: string, email: string): Promise<{ url: string }> {
    const stripe = this.requireStripe();
    if (!env.STRIPE_PRICE_ID) throw new BadRequestException('STRIPE_PRICE_ID is not set');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId,
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${env.PUBLIC_URL}/?checkout=success`,
      cancel_url: `${env.PUBLIC_URL}/?checkout=cancel`,
    });
    if (!session.url) throw new Error('stripe returned no checkout url');
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const stripe = this.requireStripe();
    if (!env.STRIPE_WEBHOOK_SECRET)
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not set');

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    await this.webhooks.handleOnce('stripe', event.id, event.type, event, async () => {
      switch (event.type) {
        case 'checkout.session.completed':
          this.logger.log({ eventId: event.id }, 'checkout completed');
          // здесь начинается бизнес-логика продукта
          break;
        default:
          this.logger.log({ eventId: event.id, type: event.type }, 'unhandled stripe event');
      }
    });
  }
}
