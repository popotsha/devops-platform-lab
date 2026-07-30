import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AppLogger } from '../logging/app-logger.service';
import { Order } from '../orders/entities/order.entity';
import {
  ORDER_CREATED_ROUTING_KEY,
  ORDER_EVENTS_EXCHANGE,
  OrderCreatedEvent,
} from './messaging.constants';
import { connectRabbitMq, sleep } from './rabbitmq-connect';

const MAX_CONNECT_ATTEMPTS = 30;

@Injectable()
export class OrderEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly rabbitmqUrl: string;
  private stopped = false;

  constructor(
    configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.rabbitmqUrl =
      configService.get<string>('RABBITMQ_URL') ?? 'amqp://guest:guest@localhost:5672';
  }

  onModuleInit() {
    void this.startPublisherLoop();
  }

  async onModuleDestroy() {
    this.stopped = true;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publishOrderCreated(orders: Order[]) {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel unavailable — skipping order.created publish', {
        event: 'messaging.publish.skipped',
      });
      return;
    }

    for (const order of orders) {
      const payload: OrderCreatedEvent = {
        event: 'order.created',
        order: {
          id: order.id,
          userEmail: order.userEmail,
          productName: order.productName,
          quantity: order.quantity,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
        },
      };

      this.channel.publish(
        ORDER_EVENTS_EXCHANGE,
        ORDER_CREATED_ROUTING_KEY,
        Buffer.from(JSON.stringify(payload)),
        { contentType: 'application/json', persistent: true },
      );
    }

    this.logger.info('Published {count} order.created events', {
      event: 'messaging.publish.order.created',
      count: orders.length,
    });
  }

  private async startPublisherLoop() {
    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS && !this.stopped; attempt++) {
      try {
        await this.connect();
        return;
      } catch (error) {
        this.logger.warn('RabbitMQ publisher connect failed (attempt {attempt}/{max})', {
          event: 'messaging.publisher.retry',
          attempt,
          max: MAX_CONNECT_ATTEMPTS,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(Math.min(attempt * 1_000, 5_000));
      }
    }

    this.logger.warn('RabbitMQ publisher stopped retrying — order events will not be published', {
      event: 'messaging.publisher.gave_up',
    });
  }

  private async connect() {
    this.connection = await connectRabbitMq(this.rabbitmqUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(ORDER_EVENTS_EXCHANGE, 'topic', { durable: true });
    this.logger.info('Connected to RabbitMQ for order event publishing', {
      event: 'messaging.connected',
    });
  }
}
