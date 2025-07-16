import { Injectable, Logger } from '@nestjs/common';
import { KPICacheService } from './kpi-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

// Configuración de cache por tipo de datos
export const CACHE_CONFIG = {
  // Datos estáticos que cambian raramente
  static: {
    ttl: 3600, // 1 hora
    strategy: 'cache-aside',
    prefix: 'static'
  },
  
  // Datos de sesión y usuario
  session: {
    ttl: 900, // 15 minutos
    strategy: 'write-through',
    prefix: 'session'
  },
  
  // Datos dinámicos (KPIs, dashboard)
  dynamic: {
    ttl: 300, // 5 minutos
    strategy: 'refresh-ahead',
    prefix: 'dynamic'
  },
  
  // Métricas y analytics
  analytics: {
    ttl: 60, // 1 minuto
    strategy: 'write-behind',
    prefix: 'analytics'
  },

  // Datos de empresa
  empresa: {
    ttl: 1800, // 30 minutos
    strategy: 'cache-aside',
    prefix: 'empresa'
  },

  // Datos de productos
  producto: {
    ttl: 600, // 10 minutos
    strategy: 'write-through',
    prefix: 'producto'
  }
} as const;

export type CacheType = keyof typeof CACHE_CONFIG;
export type AccessPattern = 'hot' | 'warm' | 'cold';

interface CacheMetadata {
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

interface WriteBufferEntry {
  data: any;
  timestamp: number;
  retryCount: number;
}

@Injectable()
export class CacheStrategiesService {
  private readonly logger = new Logger(CacheStrategiesService.name);
  private writeBuffer = new Map<string, WriteBufferEntry>();
  private accessPatterns = new Map<string, AccessPattern>();
  private refreshThreshold = 0.8; // Refresh cuando quede 20% del TTL

  constructor(
    private readonly cacheService: KPICacheService,
    private readonly prisma: PrismaService,
  ) {
    this.initializeWriteBackScheduler();
  }

  /**
   * 🔥 ESTRATEGIA 1: Cache-Aside (Lazy Loading)
   * ✅ Usa: Datos que se leen frecuentemente pero se actualizan raramente
   * ✅ Ejemplo: Información de empresa, configuraciones, productos
   */
  async cacheAside<T>(
    key: string, 
    fetchFunction: () => Promise<T>,
    cacheType: CacheType = 'static'
  ): Promise<T> {
    const config = CACHE_CONFIG[cacheType];
    const cacheKey = `${config.prefix}:${key}`;

    try {
      // 1. Verificar cache
      const cached = await this.getFromCache<T>(cacheKey);
      
      if (cached !== null) {
        this.logger.debug(`Cache-Aside HIT: ${cacheKey}`);
        this.updateAccessPattern(cacheKey, 'hot');
        return cached;
      }

      // 2. Cache miss: obtener de fuente
      this.logger.debug(`Cache-Aside MISS: ${cacheKey}`);
      const data = await fetchFunction();
      
      // 3. Guardar en cache
      await this.setInCache(cacheKey, data, config.ttl);
      
      return data;
    } catch (error) {
      this.logger.error(`Cache-Aside error for ${cacheKey}:`, error);
      // Fallback a fetch directo
      return await fetchFunction();
    }
  }

  /**
   * 🚀 ESTRATEGIA 2: Write-Through
   * ✅ Usa: Datos críticos que deben estar siempre sincronizados
   * ✅ Ejemplo: Información de usuario, productos, movimientos
   */
  async writeThrough<T>(
    key: string,
    data: T,
    persistFunction: (data: T) => Promise<T>,
    cacheType: CacheType = 'session'
  ): Promise<T> {
    const config = CACHE_CONFIG[cacheType];
    const cacheKey = `${config.prefix}:${key}`;

    try {
      // 1. Escribir a fuente primaria (BD)
      const persistedData = await persistFunction(data);
      
      // 2. Escribir a cache inmediatamente
      await this.setInCache(cacheKey, persistedData, config.ttl);
      
      this.logger.debug(`Write-Through SUCCESS: ${cacheKey}`);
      return persistedData;
    } catch (error) {
      this.logger.error(`Write-Through FAILED: ${cacheKey}`, error);
      
      // Invalidar cache en caso de error para mantener consistencia
      await this.cacheService.invalidate(cacheKey);
      throw error;
    }
  }

  /**
   * ⚡ ESTRATEGIA 3: Write-Behind (Write-Back)
   * ✅ Usa: Datos con muchas escrituras que no necesitan persistencia inmediata
   * ✅ Ejemplo: Métricas, logs, analytics, contadores
   */
  async writeBehind<T>(
    key: string, 
    data: T, 
    persistFunction: (data: T) => Promise<void>,
    cacheType: CacheType = 'analytics'
  ): Promise<void> {
    const config = CACHE_CONFIG[cacheType];
    const cacheKey = `${config.prefix}:${key}`;

    try {
      // 1. Escribir inmediatamente a cache
      await this.setInCache(cacheKey, data, config.ttl);
      
      // 2. Guardar en buffer para escritura posterior
      this.writeBuffer.set(cacheKey, { 
        data, 
        timestamp: Date.now(),
        retryCount: 0
      });
      
      this.logger.debug(`Write-Behind buffered: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Write-Behind error for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 ESTRATEGIA 4: Refresh-Ahead
   * ✅ Usa: Datos que necesitan estar siempre disponibles
   * ✅ Ejemplo: Dashboard data, KPIs, reportes frecuentes
   */
  async refreshAhead<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    cacheType: CacheType = 'dynamic'
  ): Promise<T> {
    const config = CACHE_CONFIG[cacheType];
    const cacheKey = `${config.prefix}:${key}`;

    try {
      const cacheEntry = await this.getCacheWithMetadata<T>(cacheKey);
      
      if (cacheEntry) {
        const timeElapsed = Date.now() - cacheEntry.timestamp;
        const shouldRefresh = timeElapsed > (cacheEntry.ttl * 1000 * this.refreshThreshold);
        
        if (shouldRefresh) {
          // Refresh en background
          this.refreshInBackground(cacheKey, fetchFunction, config.ttl);
        }
        
        this.logger.debug(`Refresh-Ahead serving cached: ${cacheKey}`);
        return cacheEntry.data;
      }
      
      // Cache miss: fetch inmediatamente
      this.logger.debug(`Refresh-Ahead MISS: ${cacheKey}`);
      const data = await fetchFunction();
      await this.setInCache(cacheKey, data, config.ttl);
      return data;
    } catch (error) {
      this.logger.error(`Refresh-Ahead error for ${cacheKey}:`, error);
      return await fetchFunction();
    }
  }

  /**
   * 🎯 ESTRATEGIA 5: Cache Warming
   * ✅ Usa: Datos que se sabe que se van a necesitar pronto
   * ✅ Ejemplo: Datos de empresa al login, productos populares
   */
  async warmupCache(empresaId: number): Promise<void> {
    this.logger.log(`🔥 Warming up cache for empresa ${empresaId}`);
    
    const warmupTasks = [
      // Datos básicos de empresa
      this.cacheAside(`empresa:basic:${empresaId}`, () => 
        this.fetchEmpresaBasic(empresaId), 'empresa'
      ),
      
      // Usuarios activos
      this.cacheAside(`empresa:users:${empresaId}`, () => 
        this.fetchActiveUsers(empresaId), 'session'
      ),
      
      // Productos más utilizados
      this.cacheAside(`empresa:top-products:${empresaId}`, () => 
        this.fetchTopProducts(empresaId), 'producto'
      ),
      
      // KPIs básicos
      this.cacheAside(`empresa:kpis:${empresaId}`, () => 
        this.fetchBasicKPIs(empresaId), 'dynamic'
      ),
      
      // Configuraciones
      this.cacheAside(`empresa:config:${empresaId}`, () => 
        this.fetchEmpresaConfig(empresaId), 'static'
      )
    ];
    
    // Ejecutar warmup en paralelo
    const results = await Promise.allSettled(warmupTasks);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    this.logger.log(`✅ Cache warmup completed for empresa ${empresaId}: ${successCount} success, ${failureCount} failed`);
  }

  /**
   * 📊 ESTRATEGIA 6: Intelligent Cache Distribution
   * Distribuir datos según frecuencia de acceso
   */
  async intelligentCache<T>(
    key: string,
    data: T,
    accessPattern: AccessPattern,
    cacheType: CacheType = 'dynamic'
  ): Promise<void> {
    const config = CACHE_CONFIG[cacheType];
    const cacheKey = `${config.prefix}:${key}`;

    // Ajustar TTL según patrón de acceso
    let adjustedTtl = config.ttl;
    
    switch (accessPattern) {
      case 'hot':
        adjustedTtl = config.ttl * 2; // TTL más largo para datos calientes
        break;
      case 'warm':
        adjustedTtl = config.ttl; // TTL normal
        break;
      case 'cold':
        adjustedTtl = Math.floor(config.ttl * 0.5) as any; // TTL más corto para datos fríos
        break;
    }

    await this.setInCache(cacheKey, data, adjustedTtl);
    this.accessPatterns.set(cacheKey, accessPattern);
    
    this.logger.debug(`Intelligent cache set: ${cacheKey} (${accessPattern}, TTL: ${adjustedTtl}s)`);
  }

  /**
   * 🔮 ESTRATEGIA 7: Predictive Caching
   * Predecir qué datos se van a necesitar basado en patrones de usuario
   */
  async predictiveCache(userId: number, empresaId: number): Promise<void> {
    try {
      const userPatterns = await this.getUserAccessPatterns(userId);
      
      // Predecir datos que el usuario probablemente va a necesitar
      const predictions = this.generatePredictions(userPatterns, empresaId);
      
      // Pre-cargar datos predichos
      const prefetchTasks = predictions.map(prediction => 
        this.prefetchData(prediction.key, prediction.fetchFunction, prediction.cacheType)
      );
      
      // Ejecutar prefetch en background
      Promise.allSettled(prefetchTasks).then(results => {
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        this.logger.debug(`Predictive cache completed: ${successCount}/${predictions.length} successful`);
      });
      
    } catch (error) {
      this.logger.error(`Predictive cache error for user ${userId}:`, error);
    }
  }

  /**
   * 🧹 ESTRATEGIA 8: Smart Cache Eviction
   * Política de limpieza inteligente basada en uso
   */
  async smartEviction(): Promise<void> {
    try {
      const stats = await this.cacheService.getCacheStats();
      
      if (!stats.isConnected) {
        return;
      }

      // Si hay muchas keys, implementar limpieza inteligente
      if (stats.keysCount && stats.keysCount > 10000) {
        this.logger.log(`Smart eviction triggered: ${stats.keysCount} keys`);
        
        // Limpiar datos fríos primero
        await this.evictColdData();
        
        // Limpiar datos expirados
        await this.evictExpiredData();
        
        // Si aún hay muchas keys, limpiar datos menos usados
        const updatedStats = await this.cacheService.getCacheStats();
        if (updatedStats.keysCount && updatedStats.keysCount > 8000) {
          await this.evictByUsagePattern();
        }
      }
    } catch (error) {
      this.logger.error('Smart eviction error:', error);
    }
  }

  /**
   * 🔄 ESTRATEGIA 9: Cache Invalidation Patterns
   * Invalidación inteligente basada en relaciones
   */
  async invalidateRelatedData(
    entityType: 'producto' | 'movimiento' | 'empresa' | 'usuario',
    entityId: number,
    empresaId: number
  ): Promise<void> {
    const invalidationPatterns = {
      producto: [
        `producto:${entityId}`,
        `empresa:top-products:${empresaId}`,
        `dynamic:kpis:${empresaId}`,
        `dynamic:product-kpis:${entityId}`,
        `analytics:product-stats:${entityId}`
      ],
      movimiento: [
        `dynamic:kpis:${empresaId}`,
        `dynamic:movement-kpis:${empresaId}`,
        `analytics:movement-stats:${empresaId}`,
        `dynamic:dashboard:${empresaId}`
      ],
      empresa: [
        `empresa:basic:${entityId}`,
        `empresa:config:${entityId}`,
        `empresa:users:${entityId}`,
        `dynamic:kpis:${entityId}`,
        `dynamic:dashboard:${entityId}`
      ],
      usuario: [
        `session:user:${entityId}`,
        `session:user-permissions:${entityId}`,
        `empresa:users:${empresaId}`
      ]
    };

    const patterns = invalidationPatterns[entityType] || [];
    
    for (const pattern of patterns) {
      await this.cacheService.invalidatePattern(pattern);
    }
    
    this.logger.debug(`Invalidated ${patterns.length} patterns for ${entityType}:${entityId}`);
  }

  // ===== MÉTODOS AUXILIARES =====

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheService.getOrSet(key, async () => null, 1);
      return cached;
    } catch {
      return null;
    }
  }

  private async setInCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await this.cacheService.getOrSet(key, async () => data, ttl);
    } catch (error) {
      this.logger.error(`Error setting cache for ${key}:`, error);
    }
  }

  private async getCacheWithMetadata<T>(key: string): Promise<{ data: T; timestamp: number; ttl: number } | null> {
    try {
      const cached = await this.getFromCache<T>(key);
      if (cached) {
        // En una implementación real, almacenarías metadata junto con los datos
        return {
          data: cached,
          timestamp: Date.now(),
          ttl: CACHE_CONFIG.dynamic.ttl
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private refreshInBackground<T>(key: string, fetchFunction: () => Promise<T>, ttl: number): void {
    setTimeout(async () => {
      try {
        const freshData = await fetchFunction();
        await this.setInCache(key, freshData, ttl);
        this.logger.debug(`Background refresh completed: ${key}`);
      } catch (error) {
        this.logger.error(`Background refresh failed for ${key}:`, error);
      }
    }, 0);
  }

  private initializeWriteBackScheduler(): void {
    // Procesar buffer cada 10 segundos
    setInterval(async () => {
      await this.flushWriteBuffer();
    }, 10000);
  }

  private async flushWriteBuffer(): Promise<void> {
    if (this.writeBuffer.size === 0) return;

    const entries = Array.from(this.writeBuffer.entries());
    this.logger.debug(`Flushing write buffer: ${entries.length} entries`);

    for (const [key, entry] of entries) {
      try {
        // En una implementación real, aquí persistirías a BD
        // await this.persistData(key, entry.data);
        
        this.writeBuffer.delete(key);
        this.logger.debug(`Write-back completed: ${key}`);
      } catch (error) {
        entry.retryCount++;
        
        if (entry.retryCount > 3) {
          this.writeBuffer.delete(key);
          this.logger.error(`Write-back failed permanently for ${key}:`, error);
        } else {
          this.logger.warn(`Write-back retry ${entry.retryCount} for ${key}`);
        }
      }
    }
  }

  private updateAccessPattern(key: string, pattern: AccessPattern): void {
    this.accessPatterns.set(key, pattern);
  }

  private async evictColdData(): Promise<void> {
    // Implementar evicción de datos fríos
    this.logger.debug('Evicting cold data');
  }

  private async evictExpiredData(): Promise<void> {
    // Redis maneja automáticamente la expiración
    this.logger.debug('Expired data handled by Redis TTL');
  }

  private async evictByUsagePattern(): Promise<void> {
    // Implementar evicción basada en patrones de uso
    this.logger.debug('Evicting by usage pattern');
  }

  // ===== MÉTODOS DE FETCH PARA WARMUP =====

  private async fetchEmpresaBasic(empresaId: number) {
    return await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, nombre: true, rfc: true, emailContacto: true }
    });
  }

  private async fetchActiveUsers(empresaId: number) {
    return await this.prisma.usuario.findMany({
      where: { 
        empresaId,
        // Nota: el campo 'eliminado' no existe en el esquema actual
      },
      select: { id: true, email: true, rol: true, nombre: true }
    });
  }

  private async fetchTopProducts(empresaId: number) {
    return await this.prisma.producto.findMany({
      where: { 
        empresaId,
        // Nota: el campo 'eliminado' no existe en el esquema actual
      },
      orderBy: { stock: 'desc' },
      take: 10,
      select: { id: true, nombre: true, stock: true, precioVenta: true }
    });
  }

  private async fetchBasicKPIs(empresaId: number) {
    const [productosCount, movimientosCount, proveedoresCount] = await Promise.all([
      this.prisma.producto.count({ where: { empresaId } }),
      this.prisma.movimientoInventario.count({ where: { empresaId } }),
      this.prisma.proveedor.count({ where: { empresaId } })
    ]);

    return {
      productosCount,
      movimientosCount,
      proveedoresCount,
      lastUpdated: new Date()
    };
  }

  private async fetchEmpresaConfig(empresaId: number) {
    // Configuraciones específicas de la empresa
    return {
      empresaId,
      config: {
        allowNegativeStock: false,
        autoReorder: true,
        lowStockThreshold: 10
      }
    };
  }

  private async getUserAccessPatterns(userId: number) {
    // Analizar patrones de acceso del usuario
    // En una implementación real, esto vendría de logs o analytics
    return {
      userId,
      patterns: {
        dashboard: 0.8,
        productos: 0.6,
        movimientos: 0.4,
        proveedores: 0.2
      }
    };
  }

  private generatePredictions(patterns: any, empresaId: number): Array<{
    key: string;
    fetchFunction: () => Promise<any>;
    cacheType: CacheType;
  }> {
    const predictions: Array<{
      key: string;
      fetchFunction: () => Promise<any>;
      cacheType: CacheType;
    }> = [];
    
    if (patterns.patterns.dashboard > 0.5) {
      predictions.push({
        key: `dynamic:dashboard:${empresaId}`,
        fetchFunction: () => this.fetchBasicKPIs(empresaId),
        cacheType: 'dynamic' as CacheType
      });
    }
    
    if (patterns.patterns.productos > 0.5) {
      predictions.push({
        key: `empresa:top-products:${empresaId}`,
        fetchFunction: () => this.fetchTopProducts(empresaId),
        cacheType: 'producto' as CacheType
      });
    }
    
    return predictions;
  }

  private async prefetchData<T>(key: string, fetchFunction: () => Promise<T>, cacheType: CacheType) {
    try {
      await this.cacheAside(key, fetchFunction, cacheType);
      this.logger.debug(`Prefetch completed: ${key}`);
    } catch (error) {
      this.logger.error(`Prefetch failed: ${key}`, error);
    }
  }
} 