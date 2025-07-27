import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ValidationCacheEntry {
  empresaId: number;
  tipo: 'productos' | 'proveedores' | 'movimientos';
  data: Map<string, unknown>;
  timestamp: number;
  ttl: number;
}

export interface ValidationCacheConfig {
  defaultTTL: number; // en segundos
  maxEntries: number;
  cleanupInterval: number; // en segundos
}

@Injectable()
export class ValidationCacheService {
  private readonly logger = new Logger(ValidationCacheService.name);
  private readonly cache = new Map<string, ValidationCacheEntry>();
  private readonly config: ValidationCacheConfig = {
    defaultTTL: 1800, // 30 minutos
    maxEntries: 100,
    cleanupInterval: 300 // 5 minutos
  };

  constructor(private readonly prisma: PrismaService) {
    // Iniciar limpieza automática del cache
    this.startCleanupInterval();
  }

  /**
   * Obtiene productos de la empresa desde cache o base de datos
   */
  async getProductosEmpresa(empresaId: number): Promise<Map<string, unknown>> {
    const cacheKey = `productos:${empresaId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit para productos de empresa ${empresaId}`);
      return cached as Map<string, unknown>;
    }

    this.logger.debug(`Cache miss para productos de empresa ${empresaId}, consultando BD`);
    
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
    });

    this.setCache(cacheKey, productosMap, 'productos', empresaId);
    return productosMap;
  }

  /**
   * Obtiene proveedores de la empresa desde cache o base de datos
   */
  async getProveedoresEmpresa(empresaId: number): Promise<Map<string, unknown>> {
    const cacheKey = `proveedores:${empresaId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit para proveedores de empresa ${empresaId}`);
      return cached as Map<string, unknown>;
    }

    this.logger.debug(`Cache miss para proveedores de empresa ${empresaId}, consultando BD`);
    
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
      proveedoresMap.set(proveedor.nombre.toLowerCase(), proveedor);
      if (proveedor.email) {
        proveedoresMap.set(proveedor.email.toLowerCase(), proveedor);
      }
      // Nota: RUC no está disponible en el modelo actual
      // if (proveedor.ruc) {
      //   proveedoresMap.set(proveedor.ruc, proveedor);
      // }
    });

    this.setCache(cacheKey, proveedoresMap, 'proveedores', empresaId);
    return proveedoresMap;
  }

  /**
   * Invalida el cache para una empresa específica
   */
  invalidateEmpresaCache(empresaId: number, tipo?: 'productos' | 'proveedores' | 'movimientos'): void {
    if (tipo) {
      const cacheKey = `${tipo}:${empresaId}`;
      this.cache.delete(cacheKey);
      this.logger.debug(`Cache invalidado para ${tipo} de empresa ${empresaId}`);
    } else {
      // Invalidar todo el cache de la empresa
      const keysToDelete: string[] = [];
      this.cache.forEach((entry, key) => {
        if (entry.empresaId === empresaId) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.cache.delete(key));
      this.logger.debug(`Cache invalidado para toda la empresa ${empresaId}`);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      totalSize: entries.reduce((size, entry) => size + this.getEntrySize(entry), 0),
      hitRate: 0, // Se calcularía con métricas reales
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp))
    };
  }

  /**
   * Limpia el cache expirado
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl * 1000) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.logger.debug(`Entrada expirada eliminada del cache: ${key}`);
    });

    // Si el cache está muy lleno, eliminar las entradas más antiguas
    if (this.cache.size > this.config.maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - this.config.maxEntries);
      toDelete.forEach(([key]) => {
        this.cache.delete(key);
        this.logger.debug(`Entrada antigua eliminada del cache: ${key}`);
      });
    }
  }

  /**
   * Obtiene datos del cache
   */
  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Establece datos en el cache
   */
  private setCache(key: string, data: unknown, tipo: string, empresaId: number): void {
    const entry: ValidationCacheEntry = {
      empresaId,
      tipo: tipo as 'productos' | 'proveedores' | 'movimientos',
      data: data as Map<string, unknown>,
      timestamp: Date.now(),
      ttl: this.config.defaultTTL
    };

    this.cache.set(key, entry);
    this.logger.debug(`Datos agregados al cache: ${key}`);
  }

  /**
   * Calcula el tamaño aproximado de una entrada del cache
   */
  private getEntrySize(entry: ValidationCacheEntry): number {
    let size = 0;
    entry.data.forEach((value, key) => {
      size += key.length;
      size += JSON.stringify(value).length;
    });
    return size;
  }

  /**
   * Inicia el intervalo de limpieza automática
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval * 1000);
  }
} 