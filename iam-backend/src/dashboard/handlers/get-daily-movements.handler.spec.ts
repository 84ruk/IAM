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
      $queryRaw: jest.fn().mockResolvedValue([
        {
          fecha: '2024-07-19',
          entradas: 45,
          salidas: 32,
          valorEntradas: 1250.50,
          valorSalidas: 890.25,
        },
      ]),
      producto: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, nombre: 'Producto A', stockActual: 10, stockMinimo: 5 },
          { id: 2, nombre: 'Producto B', stockActual: 3, stockMinimo: 10 },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
      proveedor: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, nombre: 'Proveedor 1' },
          { id: 2, nombre: 'Proveedor 2' },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
      movimiento: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, tipo: 'ENTRADA', cantidad: 10, valor: 100 },
          { id: 2, tipo: 'SALIDA', cantidad: 5, valor: 50 },
        ]),
        groupBy: jest.fn().mockResolvedValue([
          { tipo: 'ENTRADA', _count: { id: 10 } },
          { tipo: 'SALIDA', _count: { id: 5 } },
        ]),
      },
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

    it('should return daily movements data successfully', async () => {
      cacheService.getOrSet.mockResolvedValue({
        data: [],
        summary: {
          avgEntradasDiarias: 0,
          avgSalidasDiarias: 0,
          diaMaxActividad: '2024-07-19',
          totalMovimientos: 0,
          tendencia: 'ESTABLE',
          valorTotalInventario: 0,
          margenBrutoPromedio: 0,
          productosMasVendidos: [],
          proveedoresPrincipales: [],
          alertasStock: [],
          distribucionPorTipo: [],
        },
        meta: {
          empresaId: 1,
          source: 'cqrs',
          generatedAt: new Date().toISOString(),
          daysRequested: 7,
          totalDays: 0,
          totalProductos: 0,
          totalProveedores: 0,
          rangoFechas: {
            inicio: '2024-07-13',
            fin: '2024-07-19',
          },
        },
      });

      const result = await handler.execute(mockQuery);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        'daily-movements:1:7:ADMIN',
        expect.any(Function),
        300
      );
    });

    it('should invalidate cache when forceRefresh is true', async () => {
      const queryWithForceRefresh = new GetDailyMovementsQuery(1, 'ADMIN', 7, true);
      cacheService.getOrSet.mockResolvedValue({
        data: [],
        summary: {
          avgEntradasDiarias: 0,
          avgSalidasDiarias: 0,
          diaMaxActividad: '2024-07-19',
          totalMovimientos: 0,
          tendencia: 'ESTABLE',
          valorTotalInventario: 0,
          margenBrutoPromedio: 0,
          productosMasVendidos: [],
          proveedoresPrincipales: [],
          alertasStock: [],
          distribucionPorTipo: [],
        },
        meta: {
          empresaId: 1,
          source: 'cqrs',
          generatedAt: new Date().toISOString(),
          daysRequested: 7,
          totalDays: 0,
          totalProductos: 0,
          totalProveedores: 0,
          rangoFechas: {
            inicio: '2024-07-13',
            fin: '2024-07-19',
          },
        },
      });

      await handler.execute(queryWithForceRefresh);

      expect(cacheService.invalidate).toHaveBeenCalledWith('daily-movements:1:7:ADMIN');
    });

    it('should use default days when not provided', async () => {
      const queryWithoutDays = new GetDailyMovementsQuery(1, 'ADMIN', undefined, false);
      cacheService.getOrSet.mockResolvedValue({
        data: [],
        summary: {
          avgEntradasDiarias: 0,
          avgSalidasDiarias: 0,
          diaMaxActividad: '2024-07-19',
          totalMovimientos: 0,
          tendencia: 'ESTABLE',
          valorTotalInventario: 0,
          margenBrutoPromedio: 0,
          productosMasVendidos: [],
          proveedoresPrincipales: [],
          alertasStock: [],
          distribucionPorTipo: [],
        },
        meta: {
          empresaId: 1,
          source: 'cqrs',
          generatedAt: new Date().toISOString(),
          daysRequested: 7,
          totalDays: 0,
          totalProductos: 0,
          totalProveedores: 0,
          rangoFechas: {
            inicio: '2024-07-13',
            fin: '2024-07-19',
          },
        },
      });

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