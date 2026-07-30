import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AppLogger } from '../logging/app-logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NOTIFICATION_ORDER_CREATED_QUEUE,
  ORDER_CREATED_ROUTING_KEY,
  ORDER_EVENTS_EXCHANGE,
  OrderCreatedEvent,
} from './messaging.constants';
import { connectRabbitMq, sleep } from './rabbitmq-connect';

const MAX_CONNECT_ATTEMPTS = 30;

@Injectable()
export class OrderEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly rabbitmqUrl: string;
  private stopped = false;

  constructor(
    configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: AppLogger,
  ) {
    this.rabbitmqUrl =
      configService.get<string>('RABBITMQ_URL') ?? 'amqp://guest:guest@localhost:5672';
  }

  onModuleInit() {
    // Do not block HTTP startup — connect to RabbitMQ in the background with retries.
    void this.startConsumerLoop();
  }

  async onModuleDestroy() {
    this.stopped = true;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async startConsumerLoop() {
    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS && !this.stopped; attempt++) {
      try {
        await this.connectAndSubscribe();
        return;
      } catch (error) {
        this.logger.warn('RabbitMQ consumer connect failed (attempt {attempt}/{max})', {
          event: 'messaging.consumer.retry',
          attempt,
          max: MAX_CONNECT_ATTEMPTS,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(Math.min(attempt * 1_000, 5_000));
      }
    }

    this.logger.warn('RabbitMQ consumer stopped retrying — notifications will not be created', {
      event: 'messaging.consumer.gave_up',
    });
  }

  private async connectAndSubscribe() {
    this.connection = await connectRabbitMq(this.rabbitmqUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(ORDER_EVENTS_EXCHANGE, 'topic', { durable: true });
    await this.channel.assertQueue(NOTIFICATION_ORDER_CREATED_QUEUE, { durable: true });
    await this.channel.bindQueue(
      NOTIFICATION_ORDER_CREATED_QUEUE,
      ORDER_EVENTS_EXCHANGE,
      ORDER_CREATED_ROUTING_KEY,
    );

    await this.channel.consume(
      NOTIFICATION_ORDER_CREATED_QUEUE,
      (message) => {
        void this.handleMessage(message);
      },
      { noAck: false },
    );

    this.logger.info('Listening for order.created events on RabbitMQ', {
      event: 'messaging.consumer.ready',
      queue: NOTIFICATION_ORDER_CREATED_QUEUE,
    });
  }

  private async handleMessage(message: amqp.ConsumeMessage | null) {
    if (!message || !this.channel) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString()) as OrderCreatedEvent;

      if (payload.event !== 'order.created') {
        this.channel.ack(message);
        return;
      }

      await this.notificationsService.createFromOrderEvent(payload);
      this.logger.info('Processed email notification for order {orderId}', {
        event: 'notification.processed',
        orderId: payload.order.id,
      });
      this.channel.ack(message);
    } catch (error) {
      this.logger.warn('Failed to process order.created message', {
        event: 'messaging.consumer.process.error',
        error: error instanceof Error ? error.message : String(error),
      });
      this.channel.nack(message, false, false);
    }
  }
}
