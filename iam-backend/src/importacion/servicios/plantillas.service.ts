import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { ImportacionCacheService } from './importacion-cache.service';

@Injectable()
export class PlantillasService {
  private readonly logger = new Logger(PlantillasService.name);
  private readonly directorioPlantillas = path.join(process.cwd(), 'uploads', 'plantillas');

  constructor(private readonly cacheService: ImportacionCacheService) {
    this.asegurarDirectorioPlantillas();
  }

  /**
   * Obtiene la plantilla de productos
   */
  async generarPlantillaProductos(): Promise<string> {
    // Intentar obtener del cache primero
    const cached = await this.cacheService.getPlantillaCache<string>('productos');
    if (cached) {
      this.logger.log('✅ Plantilla de productos obtenida del cache');
      return cached;
    }

    // Usar la plantilla avanzada si existe
    const rutaPlantillaAvanzada = path.join(this.directorioPlantillas, 'plantilla-productos-avanzada.xlsx');
    
    if (fs.existsSync(rutaPlantillaAvanzada)) {
      this.logger.log('✅ Usando plantilla avanzada de productos');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('productos', 'plantilla-productos-avanzada.xlsx');
      
      return 'plantilla-productos-avanzada.xlsx';
    }

    // Fallback a la plantilla mejorada
    const rutaPlantillaMejorada = path.join(this.directorioPlantillas, 'plantilla-productos-mejorada.xlsx');
    
    if (fs.existsSync(rutaPlantillaMejorada)) {
      this.logger.log('✅ Usando plantilla mejorada de productos');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('productos', 'plantilla-productos-mejorada.xlsx');
      
      return 'plantilla-productos-mejorada.xlsx';
    }

    throw new Error('No se encontraron plantillas de productos');
  }

  /**
   * Obtiene la plantilla de proveedores
   */
  async generarPlantillaProveedores(): Promise<string> {
    // Intentar obtener del cache primero
    const cached = await this.cacheService.getPlantillaCache<string>('proveedores');
    if (cached) {
      this.logger.log('✅ Plantilla de proveedores obtenida del cache');
      return cached;
    }

    // Usar la plantilla avanzada si existe
    const rutaPlantillaAvanzada = path.join(this.directorioPlantillas, 'plantilla-proveedores-avanzada.xlsx');
    
    if (fs.existsSync(rutaPlantillaAvanzada)) {
      this.logger.log('✅ Usando plantilla avanzada de proveedores');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('proveedores', 'plantilla-proveedores-avanzada.xlsx');
      
      return 'plantilla-proveedores-avanzada.xlsx';
    }

    // Fallback a la plantilla mejorada
    const rutaPlantillaMejorada = path.join(this.directorioPlantillas, 'plantilla-proveedores-mejorada.xlsx');
    
    if (fs.existsSync(rutaPlantillaMejorada)) {
      this.logger.log('✅ Usando plantilla mejorada de proveedores');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('proveedores', 'plantilla-proveedores-mejorada.xlsx');
      
      return 'plantilla-proveedores-mejorada.xlsx';
    }

    throw new Error('No se encontraron plantillas de proveedores');
  }

  /**
   * Obtiene la plantilla de movimientos
   */
  async generarPlantillaMovimientos(): Promise<string> {
    // Intentar obtener del cache primero
    const cached = await this.cacheService.getPlantillaCache<string>('movimientos');
    if (cached) {
      this.logger.log('✅ Plantilla de movimientos obtenida del cache');
      return cached;
    }

    // Usar la plantilla avanzada si existe
    const rutaPlantillaAvanzada = path.join(this.directorioPlantillas, 'plantilla-movimientos-avanzada.xlsx');
    
    if (fs.existsSync(rutaPlantillaAvanzada)) {
      this.logger.log('✅ Usando plantilla avanzada de movimientos');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('movimientos', 'plantilla-movimientos-avanzada.xlsx');
      
      return 'plantilla-movimientos-avanzada.xlsx';
    }

    // Fallback a la plantilla mejorada
    const rutaPlantillaMejorada = path.join(this.directorioPlantillas, 'plantilla-movimientos-mejorada.xlsx');
    
    if (fs.existsSync(rutaPlantillaMejorada)) {
      this.logger.log('✅ Usando plantilla mejorada de movimientos');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('movimientos', 'plantilla-movimientos-mejorada.xlsx');
      
      return 'plantilla-movimientos-mejorada.xlsx';
    }

    throw new Error('No se encontraron plantillas de movimientos');
  }

  /**
   * Obtiene la ruta completa de una plantilla
   */
  obtenerRutaPlantilla(nombreArchivo: string): string {
    return path.join(this.directorioPlantillas, nombreArchivo);
  }

  /**
   * Lista todas las plantillas disponibles
   */
  listarPlantillas(): string[] {
    try {
      if (!fs.existsSync(this.directorioPlantillas)) {
        return [];
      }

      return fs.readdirSync(this.directorioPlantillas)
        .filter(archivo => archivo.endsWith('.xlsx') || archivo.endsWith('.xls'))
        .sort();
    } catch (error) {
      this.logger.error('Error listando plantillas:', error);
      return [];
    }
  }

  /**
   * Asegura que el directorio de plantillas existe
   */
  private asegurarDirectorioPlantillas(): void {
    if (!fs.existsSync(this.directorioPlantillas)) {
      fs.mkdirSync(this.directorioPlantillas, { recursive: true });
      this.logger.log(`📁 Directorio de plantillas creado: ${this.directorioPlantillas}`);
    }
  }
} 