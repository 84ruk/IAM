import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface EmpresaCacheEntry {
  id: number;
  nombre: string;
  exists: boolean;
  timestamp: number;
}

@Injectable()
export class EmpresaCacheService {
  private readonly logger = new Logger(EmpresaCacheService.name);
  private readonly cache = new Map<number, EmpresaCacheEntry>();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutos en milisegundos

  constructor(private prisma: PrismaService) {}

  /**
   * Verifica si una empresa existe, usando cache si está disponible
   */
  async empresaExists(empresaId: number): Promise<boolean> {
    const cached = this.cache.get(empresaId);
    const now = Date.now();

    // Si tenemos un cache válido, usarlo
    if (cached && (now - cached.timestamp) < this.cacheTtl) {
      this.logger.debug(`Cache hit para empresa ${empresaId}`);
      return cached.exists;
    }

    // Cache expirado o no existe, consultar DB
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { id: true, nombre: true },
      });

      const exists = !!empresa;
      
      // Actualizar cache
      this.cache.set(empresaId, {
        id: empresaId,
        nombre: empresa?.nombre || 'unknown',
        exists,
        timestamp: now,
      });

      this.logger.debug(`Cache miss para empresa ${empresaId}, exists: ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Error verificando empresa ${empresaId}:`, error);
      // En caso de error, asumir que no existe por seguridad
      return false;
    }
  }

  /**
   * Obtiene información de la empresa con cache
   */
  async getEmpresa(empresaId: number): Promise<{ id: number; nombre: string } | null> {
    const cached = this.cache.get(empresaId);
    const now = Date.now();

    // Si tenemos un cache válido y la empresa existe, usarlo
    if (cached && (now - cached.timestamp) < this.cacheTtl && cached.exists) {
      this.logger.debug(`Cache hit para empresa ${empresaId}`);
      return {
        id: cached.id,
        nombre: cached.nombre,
      };
    }

    // Cache expirado o no existe, consultar DB
    try {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { id: true, nombre: true },
      });

      // Actualizar cache
      this.cache.set(empresaId, {
        id: empresaId,
        nombre: empresa?.nombre || 'unknown',
        exists: !!empresa,
        timestamp: now,
      });

      this.logger.debug(`Cache miss para empresa ${empresaId}`);
      return empresa;
    } catch (error) {
      this.logger.error(`Error obteniendo empresa ${empresaId}:`, error);
      return null;
    }
  }

  /**
   * Invalida el cache de una empresa específica
   */
  invalidateEmpresa(empresaId: number): void {
    this.cache.delete(empresaId);
    this.logger.debug(`Cache invalidado para empresa ${empresaId}`);
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache limpiado completamente');
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): { size: number; entries: Array<{ id: number; nombre: string; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([id, entry]) => ({
      id,
      nombre: entry.nombre,
      age: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
} 