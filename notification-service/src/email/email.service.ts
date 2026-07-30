import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppLogger } from '../logging/app-logger.service';
import { getSmtpDisabledMessage, isSmtpEnabled } from './email.config';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  isConfigured(): boolean {
    return isSmtpEnabled(this.configService);
  }

  getDisabledMessage(): string {
    return getSmtpDisabledMessage(this.configService);
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS')?.trim();
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    if (!host) {
      throw new Error('SMTP is not configured');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  async sendMail(input: SendEmailInput): Promise<void> {
    const from =
      this.configService.get<string>('EMAIL_FROM')?.trim() ??
      'Microservice Storefront <noreply@localhost>';

    await this.getTransporter().sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    this.logger.info('Email sent to {recipient}', {
      event: 'email.sent',
      recipient: input.to,
      subject: input.subject,
    });
  }
}
