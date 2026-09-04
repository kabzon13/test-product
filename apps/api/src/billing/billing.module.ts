import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [AuthModule, WebhooksModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
