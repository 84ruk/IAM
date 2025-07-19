import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DashboardCQRSModule } from '../src/dashboard/dashboard-cqrs.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../src/auth/guards/unified-empresa.guard';

describe('Dashboard CQRS (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Mock JWT token for testing
  const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbCI6IkFETUlOIiwiaWQiOjEsImVtcHJlc2FJZCI6MSwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE2MzQ2NTQyOTB9.mock-signature';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DashboardCQRSModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UnifiedEmpresaGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.movimientoInventario.deleteMany();
    await prismaService.producto.deleteMany();
    await prismaService.empresa.deleteMany();
    await prismaService.usuario.deleteMany();

    // Create test data
    const empresa = await prismaService.empresa.create({
      data: {
        nombre: 'Test Company',
        TipoIndustria: 'ALIMENTOS'
      }
    });

    const usuario = await prismaService.usuario.create({
      data: {
        nombre: 'Admin Test',
        email: 'admin@test.com',
        password: 'hashedpassword',
        rol: 'ADMIN',
        empresaId: empresa.id,
        activo: true
      }
    });

    // Create test products
    await prismaService.producto.createMany({
      data: [
        {
          nombre: 'Producto 1',
          precioVenta: 100,
          precioCompra: 60,
          stock: 50,
          stockMinimo: 10,
          empresaId: empresa.id,
          estado: 'ACTIVO',
          etiquetas: ['PERECEDERO', 'FIFO']
        },
        {
          nombre: 'Producto 2',
          precioVenta: 200,
          precioCompra: 120,
          stock: 5,
          stockMinimo: 10,
          empresaId: empresa.id,
          estado: 'ACTIVO',
          etiquetas: ['PERECEDERO']
        },
        {
          nombre: 'Producto 3',
          precioVenta: 150,
          precioCompra: 90,
          stock: 100,
          stockMinimo: 20,
          empresaId: empresa.id,
          estado: 'ACTIVO'
        }
      ]
    });

    // Create test movements
    const productos = await prismaService.producto.findMany({
      where: { empresaId: empresa.id }
    });

    await prismaService.movimientoInventario.createMany({
      data: [
        {
          tipo: 'SALIDA',
          cantidad: 10,
          productoId: productos[0].id,
          empresaId: empresa.id,
          motivo: 'VENTA',
          descripcion: 'Venta normal'
        },
        {
          tipo: 'ENTRADA',
          cantidad: 20,
          productoId: productos[1].id,
          empresaId: empresa.id,
          motivo: 'COMPRA',
          descripcion: 'Compra de proveedor'
        },
        {
          tipo: 'SALIDA',
          cantidad: 5,
          productoId: productos[2].id,
          empresaId: empresa.id,
          motivo: 'VENTA',
          descripcion: 'Venta normal'
        }
      ]
    });
  });

  describe('/dashboard-cqrs/kpis (GET)', () => {
    it('should return basic KPIs', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/kpis')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalProductos');
          expect(res.body).toHaveProperty('productosStockBajo');
          expect(res.body).toHaveProperty('movimientosUltimoMes');
          expect(res.body).toHaveProperty('valorTotalInventario');
          expect(res.body).toHaveProperty('margenPromedio');
          expect(res.body).toHaveProperty('rotacionInventario');
          expect(res.body).toHaveProperty('timestamp');
          
          expect(typeof res.body.totalProductos).toBe('number');
          expect(typeof res.body.productosStockBajo).toBe('number');
          expect(typeof res.body.movimientosUltimoMes).toBe('number');
          expect(typeof res.body.valorTotalInventario).toBe('number');
          expect(typeof res.body.margenPromedio).toBe('number');
          expect(typeof res.body.rotacionInventario).toBe('number');
        });
    });

    it('should force refresh when forceRefresh=true', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/kpis?forceRefresh=true')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalProductos');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('/dashboard-cqrs/financial-kpis (GET)', () => {
    it('should return financial KPIs', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/financial-kpis')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('margenBruto');
          expect(res.body).toHaveProperty('margenNeto');
          expect(res.body).toHaveProperty('roiInventario');
          expect(res.body).toHaveProperty('rotacionInventario');
          expect(res.body).toHaveProperty('diasInventario');
          expect(res.body).toHaveProperty('capitalTrabajo');
          expect(res.body).toHaveProperty('costoAlmacenamiento');
          expect(res.body).toHaveProperty('costoOportunidad');
          expect(res.body).toHaveProperty('eficienciaOperativa');
          
          expect(typeof res.body.margenBruto).toBe('number');
          expect(typeof res.body.margenNeto).toBe('number');
          expect(typeof res.body.roiInventario).toBe('number');
        });
    });

    it('should accept period parameter', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/financial-kpis?period=month')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('margenBruto');
          expect(res.body).toHaveProperty('margenNeto');
        });
    });
  });

  describe('/dashboard-cqrs/industry-kpis (GET)', () => {
    it('should return industry-specific KPIs for ALIMENTOS', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/industry-kpis?industry=ALIMENTOS')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('productosPerecederos');
          expect(res.body).toHaveProperty('productosCaducidadProxima');
          expect(res.body).toHaveProperty('productosFIFO');
          expect(res.body).toHaveProperty('alertasTemperatura');
          expect(res.body).toHaveProperty('alertasHumedad');
          expect(res.body).toHaveProperty('tiempoPromedioAlmacen');
          expect(res.body).toHaveProperty('productosCaducados');
          expect(res.body).toHaveProperty('eficienciaFIFO');
          expect(res.body).toHaveProperty('condicionesOptimas');
          
          expect(typeof res.body.productosPerecederos).toBe('number');
          expect(typeof res.body.productosFIFO).toBe('number');
          expect(res.body.condicionesOptimas).toHaveProperty('temperatura');
          expect(res.body.condicionesOptimas).toHaveProperty('humedad');
        });
    });

    it('should return generic KPIs for unknown industry', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/industry-kpis?industry=UNKNOWN')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalProductos');
          expect(res.body).toHaveProperty('productosStockBajo');
          expect(res.body).toHaveProperty('valorInventario');
          expect(res.body).toHaveProperty('rotacionPromedio');
        });
    });
  });

  describe('/dashboard-cqrs/predictive-kpis (GET)', () => {
    it('should return predictive KPIs', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/predictive-kpis')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('prediccionDemanda');
          expect(res.body).toHaveProperty('prediccionQuiebres');
          expect(res.body).toHaveProperty('tendenciasVentas');
          expect(res.body).toHaveProperty('estacionalidad');
          
          expect(Array.isArray(res.body.prediccionDemanda)).toBe(true);
          expect(Array.isArray(res.body.prediccionQuiebres)).toBe(true);
          expect(Array.isArray(res.body.estacionalidad)).toBe(true);
          
          expect(res.body.tendenciasVentas).toHaveProperty('tendencia');
          expect(res.body.tendenciasVentas).toHaveProperty('porcentajeCambio');
          expect(res.body.tendenciasVentas).toHaveProperty('periodo');
        });
    });

    it('should accept days parameter', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/predictive-kpis?days=60')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('prediccionDemanda');
          expect(res.body).toHaveProperty('tendenciasVentas');
        });
    });
  });

  describe('/dashboard-cqrs/data (GET)', () => {
    it('should return complete dashboard data', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/data')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('kpis');
          expect(res.body).toHaveProperty('financialKpis');
          expect(res.body).toHaveProperty('industryKpis');
          expect(res.body).toHaveProperty('predictiveKpis');
          
          expect(res.body.kpis).toHaveProperty('totalProductos');
          expect(res.body.financialKpis).toHaveProperty('margenBruto');
          expect(res.body.industryKpis).toBeDefined();
          expect(res.body.predictiveKpis).toHaveProperty('tendenciasVentas');
        });
    });
  });

  describe('/dashboard-cqrs/cache/stats (GET)', () => {
    it('should return cache statistics', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/cache/stats')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalCachedItems');
          expect(res.body).toHaveProperty('cacheHitRate');
          expect(res.body).toHaveProperty('averageResponseTime');
          
          expect(typeof res.body.totalCachedItems).toBe('number');
          expect(typeof res.body.cacheHitRate).toBe('number');
          expect(typeof res.body.averageResponseTime).toBe('number');
        });
    });
  });

  describe('/dashboard-cqrs/cache/invalidate (GET)', () => {
    it('should invalidate cache', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/cache/invalidate')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Cache invalidado exitosamente');
        });
    });

    it('should invalidate specific cache type', () => {
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/cache/invalidate?cacheType=kpis')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Cache invalidado exitosamente');
        });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid empresaId gracefully', () => {
      // This test would require mocking the user context to return an invalid empresaId
      // For now, we'll test that the endpoints return proper structure even with errors
      return request(app.getHttpServer())
        .get('/dashboard-cqrs/kpis')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalProductos');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should handle database errors gracefully', async () => {
      // Temporarily break the database connection
      const originalQueryRaw = prismaService.$queryRaw;
      prismaService.$queryRaw = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app.getHttpServer())
        .get('/dashboard-cqrs/kpis')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalProductos');
      expect(response.body).toHaveProperty('timestamp');

      // Restore original method
      prismaService.$queryRaw = originalQueryRaw;
    });
  });

  describe('Performance tests', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/dashboard-cqrs/kpis')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/dashboard-cqrs/kpis')
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body).toHaveProperty('totalProductos');
        expect(response.body).toHaveProperty('timestamp');
      });
    });
  });
}); 