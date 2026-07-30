import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderEventsConsumer } from './order-events.consumer';

@Module({
  imports: [NotificationsModule],
  providers: [OrderEventsConsumer],
})
export class MessagingModule {}
