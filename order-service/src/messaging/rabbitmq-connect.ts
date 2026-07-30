import * as amqp from 'amqplib';

const DEFAULT_CONNECT_MS = 5_000;

export function connectRabbitMq(
  url: string,
  timeoutMs = DEFAULT_CONNECT_MS,
): Promise<amqp.ChannelModel> {
  return Promise.race([
    amqp.connect(url),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`RabbitMQ connect timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
