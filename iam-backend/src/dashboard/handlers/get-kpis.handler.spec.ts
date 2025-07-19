import { Test, TestingModule } from '@nestjs/testing';
import { GetKpisHandler } from './get-kpis.handler';
import { PrismaService } from '../../prisma/prisma.service';
import { KPICacheService } from '../../common/services/kpi-cache.service';
import { KPIErrorHandler } from '../../common/services/kpi-error-handler.service';
import { GetKpisQuery } from '../queries/get-kpis.query';
import { KPIData } from '../interfaces/kpi-data.interface';

describe('GetKpisHandler', () => {
  let handler: GetKpisHandler;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<KPICacheService>;
  let errorHandler: jest.Mocked<KPIErrorHandler>;

  const mockPrismaService = {
    producto: {
      count: jest.fn(),
      fields: {
        stockMinimo: 'stockMinimo'
      }
    },
    movimientoInventario: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  } as any; // Usar 'as any' para evitar problemas de tipos con Prisma

  const mockCacheService = {
    getOrSet: jest.fn(),
    invalidate: jest.fn(),
    getCacheStats: jest.fn(),
  };

  const mockErrorHandler = {
    handleKPIError: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetKpisHandler,
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

    handler = module.get<GetKpisHandler>(GetKpisHandler);
    prismaService = module.get(PrismaService);
    cacheService = module.get(KPICacheService);
    errorHandler = module.get(KPIErrorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const query = new GetKpisQuery(1, 'ADMIN', false);

    it('should return cached data when available', async () => {
      const cachedData: KPIData = {
        totalProductos: 100,
        productosStockBajo: 5,
        movimientosUltimoMes: 50,
        valorTotalInventario: 10000,
        margenPromedio: 25,
        rotacionInventario: 2.5,
        timestamp: new Date().toISOString(),
      };

      // Mock getOrSet para devolver datos cacheados
      cacheService.getOrSet.mockResolvedValue(cachedData);

      const result = await handler.execute(query);

      expect(result).toEqual(cachedData);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        'kpis:1:ADMIN',
        expect.any(Function),
        300,
      );
      expect(cacheService.invalidate).not.toHaveBeenCalled();
    });

    it('should calculate KPIs when cache is empty', async () => {
      const expectedKpis: KPIData = {
        totalProductos: 100,
        productosStockBajo: 5,
        movimientosUltimoMes: 50,
        valorTotalInventario: 10000,
        margenPromedio: 25,
        rotacionInventario: 2.5,
        timestamp: expect.any(String),
      };

      // Mock getOrSet para ejecutar la factory
      cacheService.getOrSet.mockImplementation(async (key, factory) => {
        return await factory();
      });

      // Mock database responses
      (prismaService.producto.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalProductos
        .mockResolvedValueOnce(5); // productosStockBajo

      (prismaService.movimientoInventario.count as jest.Mock).mockResolvedValue(50);

      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ total: 10000 }]) // valorTotalInventario
        .mockResolvedValueOnce([{ margen: 25 }]) // margenPromedio
        .mockResolvedValueOnce([{ rotacion: 2.5 }]); // rotacionInventario

      const result = await handler.execute(query);

      expect(result).toMatchObject(expectedKpis);
      expect(result.timestamp).toBeDefined();
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        'kpis:1:ADMIN',
        expect.any(Function),
        300,
      );
    });

    it('should force refresh when forceRefresh is true', async () => {
      const queryWithForce = new GetKpisQuery(1, 'ADMIN', true);
      const expectedKpis: KPIData = {
        totalProductos: 150,
        productosStockBajo: 8,
        movimientosUltimoMes: 75,
        valorTotalInventario: 15000,
        margenPromedio: 30,
        rotacionInventario: 3.0,
        timestamp: expect.any(String),
      };

      // Mock getOrSet para ejecutar la factory (force refresh)
      cacheService.getOrSet.mockImplementation(async (key, factory) => {
        return await factory();
      });

      // Mock database responses
      (prismaService.producto.count as jest.Mock)
        .mockResolvedValueOnce(150) // totalProductos
        .mockResolvedValueOnce(8); // productosStockBajo

      (prismaService.movimientoInventario.count as jest.Mock).mockResolvedValue(75);

      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ total: 15000 }]) // valorTotalInventario
        .mockResolvedValueOnce([{ margen: 30 }]) // margenPromedio
        .mockResolvedValueOnce([{ rotacion: 3.0 }]); // rotacionInventario

      const result = await handler.execute(queryWithForce);

      expect(result).toMatchObject(expectedKpis);
      expect(cacheService.invalidate).toHaveBeenCalledWith('kpis:1:ADMIN');
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        'kpis:1:ADMIN',
        expect.any(Function),
        300,
      );
    });

    it('should handle errors gracefully with fallback', async () => {
      // Mock getOrSet para ejecutar la factory
      cacheService.getOrSet.mockImplementation(async (key, factory) => {
        return await factory();
      });

      (prismaService.producto.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const fallbackData: KPIData = {
        totalProductos: 0,
        productosStockBajo: 0,
        movimientosUltimoMes: 0,
        valorTotalInventario: 0,
        margenPromedio: 0,
        rotacionInventario: 0,
        timestamp: new Date().toISOString(),
      };

      errorHandler.handleKPIError.mockReturnValue(fallbackData);

      const result = await handler.execute(query);

      expect(result).toEqual(fallbackData);
      expect(errorHandler.handleKPIError).toHaveBeenCalledWith(
        expect.any(Error),
        'Error calculando KPIs básicos',
        1
      );
    });
  });

  describe('private methods', () => {
    it('should calculate total products correctly', async () => {
      (prismaService.producto.count as jest.Mock).mockResolvedValue(100);

      const result = await (handler as any).getTotalProductos(1);

      expect(result).toBe(100);
      expect(prismaService.producto.count).toHaveBeenCalledWith({
        where: {
          empresaId: 1,
          estado: { in: ['ACTIVO', 'INACTIVO'] }
        },
      });
    });

    it('should calculate products with low stock correctly', async () => {
      (prismaService.producto.count as jest.Mock).mockResolvedValue(5);

      const result = await (handler as any).getProductosStockBajo(1);

      expect(result).toBe(5);
      expect(prismaService.producto.count).toHaveBeenCalledWith({
        where: {
          empresaId: 1,
          estado: 'ACTIVO',
          stock: {
            lte: 'stockMinimo',
          },
        },
      });
    });

    it('should calculate movements last month correctly', async () => {
      (prismaService.movimientoInventario.count as jest.Mock).mockResolvedValue(50);

      const result = await (handler as any).getMovimientosUltimoMes(1);

      expect(result).toBe(50);
      expect(prismaService.movimientoInventario.count).toHaveBeenCalledWith({
        where: {
          empresaId: 1,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });

    it('should calculate total inventory value correctly', async () => {
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([{ total: 10000 }]);

      const result = await (handler as any).getValorTotalInventario(1);

      expect(result).toBe(10000);
      expect(prismaService.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('SELECT COALESCE(SUM(p.stock * p."precioVenta"), 0) as total'),
          expect.stringContaining('FROM "Producto" p'),
          expect.stringContaining('WHERE p."empresaId" =')
        ]),
        1
      );
    });

    it('should calculate average margin correctly', async () => {
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([{ margen: 25 }]);

      const result = await (handler as any).getMargenPromedio(1);

      expect(result).toBe(25);
      expect(prismaService.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('SELECT COALESCE(AVG(p."precioVenta" - p."precioCompra"), 0) as margen'),
          expect.stringContaining('FROM "Producto" p'),
          expect.stringContaining('WHERE p."empresaId" =')
        ]),
        1
      );
    });

    it('should calculate inventory rotation correctly', async () => {
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([{ rotacion: 2.5 }]);

      const result = await (handler as any).getRotacionInventario(1);

      expect(result).toBe(2.5);
      expect(prismaService.$queryRaw).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('WITH movimientos_salida AS'),
          expect.stringContaining('SELECT'),
          expect.stringContaining('p.id'),
          expect.stringContaining('p.stock'),
          expect.stringContaining('COALESCE(SUM(m.cantidad), 0) as ventas_mes'),
          expect.stringContaining('FROM "Producto" p'),
          expect.stringContaining('LEFT JOIN "MovimientoInventario" m'),
          expect.stringContaining('WHERE p."empresaId" =')
        ]),
        1
      );
    });
  });

  describe('edge cases', () => {
    it('should handle zero values correctly', async () => {
      // Mock getOrSet para ejecutar la factory
      cacheService.getOrSet.mockImplementation(async (key, factory) => {
        return await factory();
      });

      (prismaService.producto.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      (prismaService.movimientoInventario.count as jest.Mock).mockResolvedValue(0);

      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ margen: 0 }])
        .mockResolvedValueOnce([{ rotacion: 0 }]);

      const result = await handler.execute(new GetKpisQuery(1, 'ADMIN', false));

      expect(result).toMatchObject({
        totalProductos: 0,
        productosStockBajo: 0,
        movimientosUltimoMes: 0,
        valorTotalInventario: 0,
        margenPromedio: 0,
        rotacionInventario: 0,
      });
    });

    it('should handle null database responses', async () => {
      // Mock getOrSet para ejecutar la factory
      cacheService.getOrSet.mockImplementation(async (key, factory) => {
        return await factory();
      });

      (prismaService.producto.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(5);

      (prismaService.movimientoInventario.count as jest.Mock).mockResolvedValue(50);

      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ total: null }])
        .mockResolvedValueOnce([{ margen: null }])
        .mockResolvedValueOnce([{ rotacion: null }]);

      const result = await handler.execute(new GetKpisQuery(1, 'ADMIN', false));

      expect(result).toMatchObject({
        totalProductos: 100,
        productosStockBajo: 5,
        movimientosUltimoMes: 50,
        valorTotalInventario: 0,
        margenPromedio: 0,
        rotacionInventario: 0,
      });
    });
  });
}); 