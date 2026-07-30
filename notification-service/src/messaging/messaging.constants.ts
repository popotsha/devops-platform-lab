export const ORDER_EVENTS_EXCHANGE = 'order.events';
export const ORDER_CREATED_ROUTING_KEY = 'order.created';
export const NOTIFICATION_ORDER_CREATED_QUEUE = 'notification.order-created';

export interface OrderCreatedEvent {
  event: 'order.created';
  order: {
    id: number;
    userEmail?: string;
    productName: string;
    quantity: number;
    status: string;
    createdAt: string;
  };
}
