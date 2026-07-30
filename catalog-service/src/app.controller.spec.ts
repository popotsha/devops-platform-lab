import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLogger } from './logging/app-logger.service';

describe('AppController', () => {
  let appController: AppController;
  let queryMock: jest.Mock;

  beforeEach(async () => {
    queryMock = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: { query: queryMock },
        },
        {
          provide: AppLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns ok when database is reachable', async () => {
      const health = await appController.getHealth();

      expect(health.status).toBe('ok');
      expect(health.checks.database).toBe('up');
      expect(health.service).toBe('catalog-service');
    });
  });
});
