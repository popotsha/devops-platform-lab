import {
  AppLogger,
  applyPlaceholders,
  sanitizeLogMeta,
} from './app-logger.service';
import { LogLevel } from './log-level';

describe('applyPlaceholders', () => {
  it('replaces placeholders in message', () => {
    expect(
      applyPlaceholders('Creating order for {userSub}', {
        userSub: 'abc-123',
      }),
    ).toBe('Creating order for abc-123');
  });
});

describe('sanitizeLogMeta', () => {
  it('keeps scalar values', () => {
    expect(
      sanitizeLogMeta({
        event: 'orders.create',
        itemCount: 2,
        ok: true,
      }),
    ).toEqual({
      event: 'orders.create',
      itemCount: 2,
      ok: true,
    });
  });

  it('JSON-stringifies nested objects', () => {
    expect(
      sanitizeLogMeta({
        checks: { database: 'up' },
      }),
    ).toEqual({
      checks: '{"database":"up"}',
    });
  });
});

describe('AppLogger', () => {
  beforeEach(() => {
    (AppLogger as unknown as { instance?: AppLogger }).instance = undefined;
  });

  it('getInstance returns a singleton', () => {
    const a = AppLogger.getInstance();
    const b = AppLogger.getInstance();
    expect(a).toBe(b);
  });

  it('info with values object substitutes placeholders and keeps attributes', () => {
    const emit = jest.fn();
    const log = jest.fn();
    const logger = Object.create(AppLogger.prototype) as AppLogger;

    Object.assign(logger, {
      serviceName: 'catalog-service',
      consoleLogger: { log },
      otelLogger: { emit },
      write: AppLogger.prototype['write'].bind(logger),
    });

    logger.info('Creating order for {userSub}', {
      userSub: 'abc-123',
      event: 'orders.create',
      itemCount: 2,
    });

    expect(log).toHaveBeenCalledWith(
      'info',
      'Creating order for abc-123',
      expect.objectContaining({
        service: 'catalog-service',
        userSub: 'abc-123',
        event: 'orders.create',
        itemCount: 2,
      }),
    );
  });

  it('log supports values + LogLevel overload', () => {
    const writeSpy = jest.spyOn(
      AppLogger.prototype as unknown as { write: jest.Mock },
      'write' as never,
    );
    writeSpy.mockImplementation(() => undefined);

    const logger = AppLogger.getInstance();
    logger.log(
      'Order {orderId} created',
      { orderId: 42, event: 'orders.create' },
      LogLevel.INFO,
    );

    expect(writeSpy).toHaveBeenCalledWith(
      'info',
      'Order 42 created',
      expect.objectContaining({ orderId: 42, event: 'orders.create' }),
    );

    writeSpy.mockRestore();
  });

  it('error extracts stack from values object', () => {
    const writeSpy = jest.spyOn(AppLogger.prototype as AppLogger, 'write');
    writeSpy.mockImplementation(() => undefined);

    const logger = AppLogger.getInstance();
    logger.error('Failed for {userSub}', {
      userSub: 'abc',
      stack: 'Error: boom\n    at test.ts:1:1',
    });

    expect(writeSpy).toHaveBeenCalledWith(
      'error',
      'Failed for abc',
      expect.objectContaining({
        userSub: 'abc',
        stack: 'Error: boom\n    at test.ts:1:1',
      }),
    );

    writeSpy.mockRestore();
  });
});
