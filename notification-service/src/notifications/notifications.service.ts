import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import {
  buildOrderConfirmationHtml,
  buildOrderConfirmationSubject,
  buildOrderConfirmationText,
} from '../email/templates/order-confirmation.template';
import { OrderCreatedEvent } from '../messaging/messaging.constants';
import { EmailNotification } from './entities/email-notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(EmailNotification)
    private readonly notificationRepository: Repository<EmailNotification>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  findAll() {
    return this.notificationRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createFromOrderEvent(event: OrderCreatedEvent) {
    const recipientEmail = event.order.userEmail?.trim();
    const templateParams = {
      orderId: event.order.id,
      productName: event.order.productName,
      quantity: event.order.quantity,
      status: event.order.status,
      recipientEmail: recipientEmail ?? 'customer@example.com',
      storefrontUrl: this.configService.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000',
    };

    const emailSubject = buildOrderConfirmationSubject(templateParams);

    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        orderId: event.order.id,
        recipientEmail: recipientEmail ?? undefined,
        emailSubject,
        emailTemplate: 'order_confirmation',
        status: 'pending',
      }),
    );

    if (!recipientEmail) {
      return this.notificationRepository.save({
        ...notification,
        status: 'skipped',
        errorMessage: 'Order event did not include a customer email address',
      });
    }

    if (!this.emailService.isConfigured()) {
      return this.notificationRepository.save({
        ...notification,
        status: 'skipped',
        errorMessage: this.emailService.getDisabledMessage(),
      });
    }

    try {
      await this.emailService.sendMail({
        to: recipientEmail,
        subject: emailSubject,
        html: buildOrderConfirmationHtml(templateParams),
        text: buildOrderConfirmationText(templateParams),
      });

      return this.notificationRepository.save({
        ...notification,
        status: 'sent',
        sentAt: new Date(),
        errorMessage: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.notificationRepository.save({
        ...notification,
        status: 'failed',
        errorMessage: message,
      });
    }
  }
}
