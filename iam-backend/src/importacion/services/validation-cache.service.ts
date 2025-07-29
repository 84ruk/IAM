import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionConfigService } from '../config/importacion.config';

export interface ValidationCacheEntry {
  empresaId: number;
  tipo: 'productos' | 'proveedores' | 'movimientos';
  data: Map<string, unknown>;
  timestamp: number;
  ttl: number;
  size: number;
  accessCount: number;
  lastAccess: number;
}

export interface ValidationCacheConfig {
  defaultTTL: number; // en segundos
  maxEntries: number;
  cleanupInterval: number; // en segundos
  maxMemoryUsage: number; // en bytes
  enableCompression: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
  memoryUsage: number;
  compressionRatio: number;
  evictions: number;
  errors: number;
}

@Injectable()
export class ValidationCacheService {
  private readonly logger = new Logger(ValidationCacheService.name);
  private readonly cache = new Map<string, ValidationCacheEntry>();
  private readonly config: ValidationCacheConfig;
  private evictions = 0;
  private errors = 0;
  private hits = 0;
  private misses = 0;

  constructor(private readonly prisma: PrismaService) {
    const cacheConfig = ImportacionConfigService.getConfiguracionCache();
    this.config = {
      defaultTTL: cacheConfig.ttl,
      maxEntries: cacheConfig.maxEntries,
      cleanupInterval: cacheConfig.cleanupInterval,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      enableCompression: false, // Por ahora deshabilitado
    };

    // Iniciar limpieza automática del cache
    this.startCleanupInterval();
    
    this.logger.log(`Cache de validación inicializado con ${this.config.maxEntries} entradas máximas y TTL de ${this.config.defaultTTL}s`);
  }

  /**
   * Obtiene productos de la empresa desde cache o base de datos
   */
  async getProductosEmpresa(empresaId: number): Promise<Map<string, unknown>> {
    const cacheKey = `productos:${empresaId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      this.hits++;
      this.logger.debug(`Cache hit para productos de empresa ${empresaId}`);
      return cached as Map<string, unknown>;
    }

    this.misses++;
    this.logger.debug(`Cache miss para productos de empresa ${empresaId}, consultando BD`);
    
    try {
      const productos = await this.prisma.producto.findMany({
        where: { empresaId, estado: 'ACTIVO' },
        select: {
          id: true,
          nombre: true,
          codigoBarras: true,
          sku: true,
          stock: true,
          precioCompra: true,
          precioVenta: true,
          tipoProducto: true,
          unidad: true,
          etiquetas: true,
        }
      });

      const productosMap = new Map<string, unknown>();
      productos.forEach(producto => {
        // Múltiples claves para búsqueda flexible
        productosMap.set(producto.nombre.toLowerCase(), producto);
        if (producto.codigoBarras) {
          productosMap.set(producto.codigoBarras, producto);
        }
        if (producto.sku) {
          productosMap.set(producto.sku, producto);
        }
        // También indexar por ID para búsquedas rápidas
        productosMap.set(`id:${producto.id}`, producto);
      });

      this.setCache(cacheKey, productosMap, 'productos', empresaId);
      return productosMap;
    } catch (error) {
      this.errors++;
      this.logger.error(`Error obteniendo productos de empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene proveedores de la empresa desde cache o base de datos
   */
  async getProveedoresEmpresa(empresaId: number): Promise<Map<string, unknown>> {
    const cacheKey = `proveedores:${empresaId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      this.hits++;
      this.logger.debug(`Cache hit para proveedores de empresa ${empresaId}`);
      return cached as Map<string, unknown>;
    }

    this.misses++;
    this.logger.debug(`Cache miss para proveedores de empresa ${empresaId}, consultando BD`);
    
    try {
      const proveedores = await this.prisma.proveedor.findMany({
        where: { empresaId, estado: 'ACTIVO' },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
        }
      });

      const proveedoresMap = new Map<string, unknown>();
      proveedores.forEach(proveedor => {
        // Múltiples claves para búsqueda flexible
        proveedoresMap.set(proveedor.nombre.toLowerCase(), proveedor);
        if (proveedor.email) {
          proveedoresMap.set(proveedor.email.toLowerCase(), proveedor);
        }
        // También indexar por ID para búsquedas rápidas
        proveedoresMap.set(`id:${proveedor.id}`, proveedor);
      });

      this.setCache(cacheKey, proveedoresMap, 'proveedores', empresaId);
      return proveedoresMap;
    } catch (error) {
      this.errors++;
      this.logger.error(`Error obteniendo proveedores de empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene movimientos de la empresa desde cache o base de datos
   */
  async getMovimientosEmpresa(empresaId: number): Promise<Map<string, unknown>> {
    const cacheKey = `movimientos:${empresaId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      this.hits++;
      this.logger.debug(`Cache hit para movimientos de empresa ${empresaId}`);
      return cached as Map<string, unknown>;
    }

    this.misses++;
    this.logger.debug(`Cache miss para movimientos de empresa ${empresaId}, consultando BD`);
    
    try {
      const movimientos = await this.prisma.movimientoInventario.findMany({
        where: { empresaId, estado: 'ACTIVO' },
        select: {
          id: true,
          productoId: true,
          cantidad: true,
          tipo: true,
          fecha: true,
          motivo: true,
        },
        orderBy: { fecha: 'desc' },
        take: 1000, // Limitar a los últimos 1000 movimientos
      });

      const movimientosMap = new Map<string, unknown>();
      movimientos.forEach(movimiento => {
        // Indexar por producto y fecha
        const key = `${movimiento.productoId}:${movimiento.fecha.toISOString().split('T')[0]}`;
        movimientosMap.set(key, movimiento);
        // También indexar por ID
        movimientosMap.set(`id:${movimiento.id}`, movimiento);
      });

      this.setCache(cacheKey, movimientosMap, 'movimientos', empresaId);
      return movimientosMap;
    } catch (error) {
      this.errors++;
      this.logger.error(`Error obteniendo movimientos de empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Invalida el cache de una empresa específica
   */
  invalidateEmpresaCache(empresaId: number, tipo?: 'productos' | 'proveedores' | 'movimientos'): void {
    if (tipo) {
      const key = `${tipo}:${empresaId}`;
      this.cache.delete(key);
      this.logger.debug(`Cache invalidado para ${tipo} de empresa ${empresaId}`);
    } else {
      // Invalidar todos los tipos
      ['productos', 'proveedores', 'movimientos'].forEach(t => {
        const key = `${t}:${empresaId}`;
        this.cache.delete(key);
      });
      this.logger.debug(`Cache invalidado para todos los tipos de empresa ${empresaId}`);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const hitRate = this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0;
    const oldestEntry = entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0;
    const newestEntry = entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      oldestEntry,
      newestEntry,
      memoryUsage: totalSize, // Usar directamente totalSize en lugar de llamar getMemoryUsage()
      compressionRatio: 1.0, // Por ahora sin compresión
      evictions: this.evictions,
      errors: this.errors,
    };
  }

  /**
   * Verifica la salud del cache y detecta problemas potenciales
   */
  getCacheHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const memoryUsage = this.getMemoryUsage();
    const hitRate = this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0;
    
    // Verificar uso de memoria
    if (memoryUsage > this.config.maxMemoryUsage * 0.8) {
      issues.push(`Uso de memoria alto: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
      recommendations.push('Considerar reducir el TTL o aumentar el límite de memoria');
    }
    
    // Verificar número de entradas
    if (this.cache.size > this.config.maxEntries * 0.8) {
      issues.push(`Muchas entradas en cache: ${this.cache.size}`);
      recommendations.push('Considerar aumentar maxEntries o reducir TTL');
    }
    
    // Verificar tasa de aciertos
    if (hitRate < 0.5 && this.hits + this.misses > 10) {
      issues.push(`Tasa de aciertos baja: ${Math.round(hitRate * 100)}%`);
      recommendations.push('Revisar estrategia de cache o aumentar TTL');
    }
    
    // Verificar errores
    if (this.errors > 0) {
      issues.push(`Errores detectados: ${this.errors}`);
      recommendations.push('Revisar logs para identificar problemas');
    }
    
    // Determinar estado
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'critical' : 'warning';
    }
    
    return {
      status,
      issues,
      recommendations,
    };
  }

  /**
   * Limpia entradas expiradas del cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      this.logger.debug(`Limpiadas ${expiredKeys.length} entradas expiradas del cache`);
    }

    // Verificar límite de memoria
    this.checkMemoryLimit();
  }

  /**
   * Verifica y aplica límites de memoria
   */
  private checkMemoryLimit(): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage > this.config.maxMemoryUsage) {
      this.logger.warn(`Uso de memoria del cache excede el límite: ${memoryUsage} > ${this.config.maxMemoryUsage}`);
      this.evictLeastUsed();
    }

    // Verificar límite de entradas
    if (this.cache.size > this.config.maxEntries) {
      this.logger.warn(`Número de entradas del cache excede el límite: ${this.cache.size} > ${this.config.maxEntries}`);
      this.evictLeastUsed();
    }
  }

  /**
   * Expulsa las entradas menos usadas
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por acceso (menos accedidas primero) y luego por timestamp
    entries.sort((a, b) => {
      if (a[1].accessCount !== b[1].accessCount) {
        return a[1].accessCount - b[1].accessCount;
      }
      return a[1].timestamp - b[1].timestamp;
    });

    // Expulsar el 20% de las entradas menos usadas
    const toEvict = Math.ceil(entries.length * 0.2);
    const evictedKeys = entries.slice(0, toEvict).map(([key]) => key);

    evictedKeys.forEach(key => {
      this.cache.delete(key);
    });

    this.evictions += evictedKeys.length;
    this.logger.debug(`Expulsadas ${evictedKeys.length} entradas menos usadas del cache`);
  }

  /**
   * Obtiene una entrada del cache
   */
  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccess = now;

    return entry.data;
  }

  /**
   * Establece una entrada en el cache
   */
  private setCache(key: string, data: unknown, tipo: string, empresaId: number): void {
    const size = this.getEntrySize(data);
    const entry: ValidationCacheEntry = {
      empresaId,
      tipo: tipo as 'productos' | 'proveedores' | 'movimientos',
      data: data as Map<string, unknown>,
      timestamp: Date.now(),
      ttl: this.config.defaultTTL,
      size,
      accessCount: 1,
      lastAccess: Date.now(),
    };

    // Verificar si hay espacio antes de agregar
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLeastUsed();
    }

    this.cache.set(key, entry);
  }

  /**
   * Calcula el tamaño aproximado de una entrada
   */
  private getEntrySize(data: unknown): number {
    try {
      const jsonString = JSON.stringify(data);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch (error) {
      // Si no se puede serializar, estimar basado en el tipo
      if (data instanceof Map) {
        return data.size * 100; // Estimación aproximada
      }
      return 1024; // Tamaño por defecto
    }
  }

  /**
   * Obtiene el uso de memoria actual
   */
  private getMemoryUsage(): number {
    const entries = Array.from(this.cache.values());
    return entries.reduce((sum, entry) => sum + entry.size, 0);
  }

  /**
   * Inicia el intervalo de limpieza automática
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      try {
        // Protección contra recursión excesiva
        if (this.cache.size > 0) {
          this.cleanupExpiredEntries();
        }
      } catch (error) {
        this.errors++;
        this.logger.error('Error en limpieza automática del cache:', error);
        
        // Si hay un error crítico, limpiar el cache para evitar problemas
        if (error instanceof RangeError && error.message.includes('Maximum call stack size exceeded')) {
          this.logger.error('Error de recursión detectado, limpiando cache de emergencia');
          this.clearCache();
        }
      }
    }, this.config.cleanupInterval * 1000);
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.errors = 0;
    this.logger.log('Cache completamente limpiado');
  }

  /**
   * Obtiene información detallada de una entrada específica
   */
  getEntryInfo(key: string): ValidationCacheEntry | null {
    return this.cache.get(key) || null;
  }

  /**
   * Lista todas las claves en el cache
   */
  listCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Optimiza el cache eliminando entradas redundantes
   */
  optimizeCache(): void {
    const beforeSize = this.cache.size;
    const beforeMemory = this.getMemoryUsage();

    // Eliminar entradas duplicadas o muy similares
    const entries = Array.from(this.cache.entries());
    const toRemove: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [key1, entry1] = entries[i];
        const [key2, entry2] = entries[j];

        // Si son de la misma empresa y tipo, pero diferentes timestamps
        if (entry1.empresaId === entry2.empresaId && 
            entry1.tipo === entry2.tipo && 
            Math.abs(entry1.timestamp - entry2.timestamp) < 60000) { // 1 minuto
          // Mantener la más reciente
          if (entry1.timestamp < entry2.timestamp) {
            toRemove.push(key1);
          } else {
            toRemove.push(key2);
          }
        }
      }
    }

    toRemove.forEach(key => this.cache.delete(key));

    const afterSize = this.cache.size;
    const afterMemory = this.getMemoryUsage();

    this.logger.log(`Optimización del cache completada: ${beforeSize - afterSize} entradas eliminadas, ${beforeMemory - afterMemory} bytes liberados`);
  }
} 