import { Test, TestingModule } from '@nestjs/testing';
import { DashboardCQRSService } from './dashboard-cqrs.service';
import { GetKpisHandler } from './handlers/get-kpis.handler';
import { GetFinancialKpisHandler } from './handlers/get-financial-kpis.handler';
import { GetIndustryKpisHandler } from './handlers/get-industry-kpis.handler';
import { GetPredictiveKpisHandler } from './handlers/get-predictive-kpis.handler';
import { GetKpisQuery } from './queries/get-kpis.query';
import { GetFinancialKpisQuery } from './queries/get-financial-kpis.query';
import { GetIndustryKpisQuery } from './queries/get-industry-kpis.query';
import { GetPredictiveKpisQuery } from './queries/get-predictive-kpis.query';
import { KPIData } from './interfaces/kpi-data.interface';
import { FinancialKPIs } from './interfaces/financial-kpis.interface';

describe('DashboardCQRSService', () => {
  let service: DashboardCQRSService;
  let getKpisHandler: jest.Mocked<GetKpisHandler>;
  let getFinancialKpisHandler: jest.Mocked<GetFinancialKpisHandler>;
  let getIndustryKpisHandler: jest.Mocked<GetIndustryKpisHandler>;
  let getPredictiveKpisHandler: jest.Mocked<GetPredictiveKpisHandler>;

  const mockGetKpisHandler = {
    execute: jest.fn()
  };

  const mockGetFinancialKpisHandler = {
    execute: jest.fn()
  };

  const mockGetIndustryKpisHandler = {
    execute: jest.fn()
  };

  const mockGetPredictiveKpisHandler = {
    execute: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardCQRSService,
        {
          provide: GetKpisHandler,
          useValue: mockGetKpisHandler
        },
        {
          provide: GetFinancialKpisHandler,
          useValue: mockGetFinancialKpisHandler
        },
        {
          provide: GetIndustryKpisHandler,
          useValue: mockGetIndustryKpisHandler
        },
        {
          provide: GetPredictiveKpisHandler,
          useValue: mockGetPredictiveKpisHandler
        }
      ]
    }).compile();

    service = module.get<DashboardCQRSService>(DashboardCQRSService);
    getKpisHandler = module.get(GetKpisHandler);
    getFinancialKpisHandler = module.get(GetFinancialKpisHandler);
    getIndustryKpisHandler = module.get(GetIndustryKpisHandler);
    getPredictiveKpisHandler = module.get(GetPredictiveKpisHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getKpis', () => {
    it('should call GetKpisHandler with correct parameters', async () => {
      const mockKpis: KPIData = {
        totalProductos: 100,
        productosStockBajo: 5,
        movimientosUltimoMes: 50,
        valorTotalInventario: 10000,
        margenPromedio: 25,
        rotacionInventario: 2.5,
        timestamp: new Date().toISOString()
      };

      getKpisHandler.execute.mockResolvedValue(mockKpis);

      const result = await service.getKpis(1, 'ADMIN', false);

      expect(result).toEqual(mockKpis);
      expect(getKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          userRole: 'ADMIN',
          forceRefresh: false
        })
      );
    });

    it('should handle force refresh parameter', async () => {
      const mockKpis: KPIData = {
        totalProductos: 100,
        productosStockBajo: 5,
        movimientosUltimoMes: 50,
        valorTotalInventario: 10000,
        margenPromedio: 25,
        rotacionInventario: 2.5,
        timestamp: new Date().toISOString()
      };

      getKpisHandler.execute.mockResolvedValue(mockKpis);

      await service.getKpis(1, 'ADMIN', true);

      expect(getKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          userRole: 'ADMIN',
          forceRefresh: true
        })
      );
    });
  });

  describe('getFinancialKPIs', () => {
    it('should call GetFinancialKpisHandler with correct parameters', async () => {
      const mockFinancialKpis: FinancialKPIs = {
        margenBruto: 30,
        margenNeto: 25,
        roiInventario: 15,
        rotacionInventario: 2.5,
        diasInventario: 146,
        capitalTrabajo: 50000,
        costoAlmacenamiento: 1000,
        costoOportunidad: 333,
        eficienciaOperativa: 85
      };

      getFinancialKpisHandler.execute.mockResolvedValue(mockFinancialKpis);

      const result = await service.getFinancialKPIs(1, 'ADMIN', 'month', false);

      expect(result).toEqual(mockFinancialKpis);
      expect(getFinancialKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          userRole: 'ADMIN',
          period: 'month',
          forceRefresh: false
        })
      );
    });

    it('should use default period when not provided', async () => {
      const mockFinancialKpis: FinancialKPIs = {
        margenBruto: 30,
        margenNeto: 25,
        roiInventario: 15,
        rotacionInventario: 2.5,
        diasInventario: 146,
        capitalTrabajo: 50000,
        costoAlmacenamiento: 1000,
        costoOportunidad: 333,
        eficienciaOperativa: 85
      };

      getFinancialKpisHandler.execute.mockResolvedValue(mockFinancialKpis);

      await service.getFinancialKPIs(1, 'ADMIN', undefined, false);

      expect(getFinancialKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          userRole: 'ADMIN',
          period: undefined,
          forceRefresh: false
        })
      );
    });
  });

  describe('getIndustryKPIs', () => {
    it('should call GetIndustryKpisHandler with correct parameters', async () => {
      const mockIndustryKpis = {
        totalProductos: 100,
        productosStockBajo: 5,
        valorInventario: 10000,
        rotacionPromedio: 2.5
      };

      getIndustryKpisHandler.execute.mockResolvedValue(mockIndustryKpis);

      const result = await service.getIndustryKPIs(1, 'ALIMENTOS', 'ADMIN', false);

      expect(result).toEqual(mockIndustryKpis);
      expect(getIndustryKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          industry: 'ALIMENTOS',
          userRole: 'ADMIN',
          forceRefresh: false
        })
      );
    });

    it('should handle undefined industry parameter', async () => {
      const mockIndustryKpis = {
        totalProductos: 100,
        productosStockBajo: 5,
        valorInventario: 10000,
        rotacionPromedio: 2.5
      };

      getIndustryKpisHandler.execute.mockResolvedValue(mockIndustryKpis);

      await service.getIndustryKPIs(1, undefined, 'ADMIN', false);

      expect(getIndustryKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          industry: undefined,
          userRole: 'ADMIN',
          forceRefresh: false
        })
      );
    });
  });

  describe('getPredictiveKPIs', () => {
    it('should call GetPredictiveKpisHandler with correct parameters', async () => {
      const mockPredictiveKpis = {
        prediccionDemanda: [],
        prediccionQuiebres: [],
        tendenciasVentas: {
          tendencia: 'CRECIENTE' as const,
          porcentajeCambio: 15,
          periodo: '30 días'
        },
        estacionalidad: []
      };

      getPredictiveKpisHandler.execute.mockResolvedValue(mockPredictiveKpis);

      const result = await service.getPredictiveKPIs(1, 30, 'ADMIN', false);

      expect(result).toEqual(mockPredictiveKpis);
      expect(getPredictiveKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          days: 30,
          userRole: 'ADMIN',
          forceRefresh: false
        })
      );
    });

    it('should use default days when not provided', async () => {
      const mockPredictiveKpis = {
        prediccionDemanda: [],
        prediccionQuiebres: [],
        tendenciasVentas: {
          tendencia: 'ESTABLE' as const,
          porcentajeCambio: 0,
          periodo: '30 días'
        },
        estacionalidad: []
      };

      getPredictiveKpisHandler.execute.mockResolvedValue(mockPredictiveKpis);

      await service.getPredictiveKPIs(1, undefined, 'ADMIN', false);

      expect(getPredictiveKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          days: undefined,
          userRole: 'ADMIN',
          forceRefresh: false
        })
      );
    });
  });

  describe('getDashboardData', () => {
    it('should return all KPIs data', async () => {
      const mockKpis: KPIData = {
        totalProductos: 100,
        productosStockBajo: 5,
        movimientosUltimoMes: 50,
        valorTotalInventario: 10000,
        margenPromedio: 25,
        rotacionInventario: 2.5,
        timestamp: new Date().toISOString()
      };

      const mockFinancialKpis: FinancialKPIs = {
        margenBruto: 30,
        margenNeto: 25,
        roiInventario: 15,
        rotacionInventario: 2.5,
        diasInventario: 146,
        capitalTrabajo: 50000,
        costoAlmacenamiento: 1000,
        costoOportunidad: 333,
        eficienciaOperativa: 85
      };

      const mockIndustryKpis = {
        totalProductos: 100,
        productosStockBajo: 5,
        valorInventario: 10000,
        rotacionPromedio: 2.5
      };

      const mockPredictiveKpis = {
        prediccionDemanda: [],
        prediccionQuiebres: [],
        tendenciasVentas: {
          tendencia: 'CRECIENTE' as const,
          porcentajeCambio: 15,
          periodo: '30 días'
        },
        estacionalidad: []
      };

      getKpisHandler.execute.mockResolvedValue(mockKpis);
      getFinancialKpisHandler.execute.mockResolvedValue(mockFinancialKpis);
      getIndustryKpisHandler.execute.mockResolvedValue(mockIndustryKpis);
      getPredictiveKpisHandler.execute.mockResolvedValue(mockPredictiveKpis);

      const result = await service.getDashboardData(1, 'ADMIN');

      expect(result).toEqual({
        kpis: mockKpis,
        financialKpis: mockFinancialKpis,
        industryKpis: mockIndustryKpis,
        predictiveKpis: mockPredictiveKpis
      });

      expect(getKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          userRole: 'ADMIN'
        })
      );

      expect(getFinancialKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          userRole: 'ADMIN',
          period: undefined
        })
      );

      expect(getIndustryKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          industry: undefined,
          userRole: 'ADMIN'
        })
      );

      expect(getPredictiveKpisHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 1,
          days: 30,
          userRole: 'ADMIN'
        })
      );
    });

    it('should handle errors in individual handlers gracefully', async () => {
      const mockKpis: KPIData = {
        totalProductos: 100,
        productosStockBajo: 5,
        movimientosUltimoMes: 50,
        valorTotalInventario: 10000,
        margenPromedio: 25,
        rotacionInventario: 2.5,
        timestamp: new Date().toISOString()
      };

      getKpisHandler.execute.mockResolvedValue(mockKpis);
      getFinancialKpisHandler.execute.mockRejectedValue(new Error('Database error'));
      getIndustryKpisHandler.execute.mockResolvedValue({
        totalProductos: 0,
        productosStockBajo: 0,
        valorInventario: 0,
        rotacionPromedio: 0
      });
      getPredictiveKpisHandler.execute.mockResolvedValue({
        prediccionDemanda: [],
        prediccionQuiebres: [],
        tendenciasVentas: {
          tendencia: 'ESTABLE' as const,
          porcentajeCambio: 0,
          periodo: '30 días'
        },
        estacionalidad: []
      });

      const result = await service.getDashboardData(1, 'ADMIN');

      expect(result).toHaveProperty('kpis', mockKpis);
      expect(result).toHaveProperty('financialKpis');
      expect(result).toHaveProperty('industryKpis');
      expect(result).toHaveProperty('predictiveKpis');
    });
  });

  describe('invalidateCache', () => {
    it('should log cache invalidation', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.invalidateCache(1, 'kpis');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Invalidando cache del dashboard',
        { empresaId: 1, cacheType: 'kpis' }
      );

      loggerSpy.mockRestore();
    });

    it('should handle cache invalidation without cache type', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.invalidateCache(1);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Invalidando cache del dashboard',
        { empresaId: 1, cacheType: undefined }
      );

      loggerSpy.mockRestore();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const result = await service.getCacheStats();

      expect(result).toEqual({
        totalCachedItems: 0,
        cacheHitRate: 0,
        averageResponseTime: 0
      });
    });
  });
}); 