import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { Resend } from 'resend';

import { env } from '../env';

import * as templates from './templates';

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

class SmtpProvider implements EmailProvider {
  private readonly transporter: Transporter;

  constructor(url: string) {
    this.transporter = createTransport(url);
  }

  async send(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({ from: env.EMAIL_FROM, ...input });
  }
}

class ResendProvider implements EmailProvider {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(input: SendEmailInput): Promise<void> {
    const { error } = await this.resend.emails.send({ from: env.EMAIL_FROM, ...input });
    if (error) throw new Error(`resend: ${error.message}`);
  }
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: EmailProvider;
  readonly templates = templates;

  constructor() {
    if (env.EMAIL_PROVIDER === 'resend') {
      if (!env.RESEND_API_KEY) {
        throw new Error('EMAIL_PROVIDER=resend requires RESEND_API_KEY');
      }
      this.provider = new ResendProvider(env.RESEND_API_KEY);
      return;
    }
    this.provider = new SmtpProvider(env.SMTP_URL);
  }

  async send(input: SendEmailInput): Promise<void> {
    try {
      await this.provider.send(input);
    } catch (err) {
      // письмо не должно ронять запрос; ошибка видна в логах и алертах
      this.logger.error({ err, to: input.to, subject: input.subject }, 'email send failed');
      throw err;
    }
  }
}
