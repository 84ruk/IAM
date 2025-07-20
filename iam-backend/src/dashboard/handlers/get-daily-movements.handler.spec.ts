import { Test, TestingModule } from '@nestjs/testing';
import { GetDailyMovementsHandler } from './get-daily-movements.handler';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { GetDailyMovementsQuery } from '../queries/get-daily-movements.query';
import { DailyMovementsResponse } from '../interfaces/daily-movements.interface';

describe('GetDailyMovementsHandler', () => {
  let handler: GetDailyMovementsHandler;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<KPICacheService>;
  let errorHandler: jest.Mocked<KPIErrorHandler>;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    const mockCacheService = {
      getOrSet: jest.fn(),
      invalidate: jest.fn(),
    };

    const mockErrorHandler = {
      handleKPIError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyMovementsHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: KPICacheService,
          useValue: mockCacheService,
        },
        {
          provide: KPIErrorHandler,
          useValue: mockErrorHandler,
        },
      ],
    }).compile();

    handler = module.get<GetDailyMovementsHandler>(GetDailyMovementsHandler);
    prismaService = module.get(PrismaService);
    cacheService = module.get(KPICacheService);
    errorHandler = module.get(KPIErrorHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const mockQuery = new GetDailyMovementsQuery(1, 'ADMIN', 7, false);
    const mockResponse: DailyMovementsResponse = {
      data: [
        {
          fecha: '2024-07-19',
          entradas: 45,
          salidas: 32,
          neto: 13,
          valorEntradas: 1250.50,
          valorSalidas: 890.25,
          valorNeto: 360.25,
        },
      ],
      summary: {
        avgEntradasDiarias: 42.3,
        avgSalidasDiarias: 38.7,
        diaMaxActividad: '2024-07-15',
        totalMovimientos: 77,
        tendencia: 'CRECIENTE',
      },
      meta: {
        empresaId: 1,
        source: 'cqrs',
        generatedAt: '2024-07-19T10:30:00Z',
        daysRequested: 7,
        totalDays: 1,
      },
    };

    it('should return daily movements data successfully', async () => {
      cacheService.getOrSet.mockResolvedValue(mockResponse);

      const result = await handler.execute(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        'daily-movements:1:7:ADMIN',
        expect.any(Function),
        300
      );
    });

    it('should invalidate cache when forceRefresh is true', async () => {
      const queryWithForceRefresh = new GetDailyMovementsQuery(1, 'ADMIN', 7, true);
      cacheService.getOrSet.mockResolvedValue(mockResponse);

      await handler.execute(queryWithForceRefresh);

      expect(cacheService.invalidate).toHaveBeenCalledWith('daily-movements:1:7:ADMIN');
    });

    it('should use default days when not provided', async () => {
      const queryWithoutDays = new GetDailyMovementsQuery(1, 'ADMIN', undefined, false);
      cacheService.getOrSet.mockResolvedValue(mockResponse);

      await handler.execute(queryWithoutDays);

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        'daily-movements:1:7:ADMIN',
        expect.any(Function),
        300
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { error: 'Error calculando movimientos diarios' };
      
      cacheService.getOrSet.mockRejectedValue(error);
      errorHandler.handleKPIError.mockReturnValue(mockErrorResponse);

      const result = await handler.execute(mockQuery);

      expect(result).toEqual(mockErrorResponse);
      expect(errorHandler.handleKPIError).toHaveBeenCalledWith(
        error,
        'Error calculando movimientos diarios',
        1
      );
    });

    it('should validate empresaId correctly', async () => {
      const invalidQuery = new GetDailyMovementsQuery(0, 'ADMIN', 7, false);

      await expect(handler.execute(invalidQuery)).rejects.toThrow('empresaId debe ser un número positivo');
    });

    it('should validate days parameter correctly', async () => {
      const invalidQuery = new GetDailyMovementsQuery(1, 'ADMIN', 400, false);

      await expect(handler.execute(invalidQuery)).rejects.toThrow('days debe estar entre 1 y 365');
    });
  });
}); 