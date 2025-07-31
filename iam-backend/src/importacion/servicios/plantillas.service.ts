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

    // Usar la plantilla automática si existe
    const rutaPlantillaAuto = path.join(this.directorioPlantillas, 'plantilla-productos-auto.xlsx');
    
    if (fs.existsSync(rutaPlantillaAuto)) {
      this.logger.log('✅ Usando plantilla automática de productos');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('productos', 'plantilla-productos-auto.xlsx');
      
      return 'plantilla-productos-auto.xlsx';
    }

    // Fallback a la plantilla básica
    const rutaPlantillaBasica = path.join(this.directorioPlantillas, 'plantilla-productos.xlsx');
    
    if (fs.existsSync(rutaPlantillaBasica)) {
      this.logger.log('✅ Usando plantilla básica de productos');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('productos', 'plantilla-productos.xlsx');
      
      return 'plantilla-productos.xlsx';
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

    // Usar la plantilla automática si existe
    const rutaPlantillaAuto = path.join(this.directorioPlantillas, 'plantilla-proveedores-auto.xlsx');
    
    if (fs.existsSync(rutaPlantillaAuto)) {
      this.logger.log('✅ Usando plantilla automática de proveedores');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('proveedores', 'plantilla-proveedores-auto.xlsx');
      
      return 'plantilla-proveedores-auto.xlsx';
    }

    // Fallback a la plantilla básica
    const rutaPlantillaBasica = path.join(this.directorioPlantillas, 'plantilla-proveedores.xlsx');
    
    if (fs.existsSync(rutaPlantillaBasica)) {
      this.logger.log('✅ Usando plantilla básica de proveedores');

      // Guardar en cache
      await this.cacheService.setPlantillaCache('proveedores', 'plantilla-proveedores.xlsx');
    
      return 'plantilla-proveedores.xlsx';
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

    // Usar la plantilla automática si existe
    const rutaPlantillaAuto = path.join(this.directorioPlantillas, 'plantilla-movimientos-auto.xlsx');
    
    if (fs.existsSync(rutaPlantillaAuto)) {
      this.logger.log('✅ Usando plantilla automática de movimientos');
      
      // Guardar en cache
      await this.cacheService.setPlantillaCache('movimientos', 'plantilla-movimientos-auto.xlsx');
      
      return 'plantilla-movimientos-auto.xlsx';
    }

    // Fallback a la plantilla básica
    const rutaPlantillaBasica = path.join(this.directorioPlantillas, 'plantilla-movimientos.xlsx');
    
    if (fs.existsSync(rutaPlantillaBasica)) {
      this.logger.log('✅ Usando plantilla básica de movimientos');

      // Guardar en cache
      await this.cacheService.setPlantillaCache('movimientos', 'plantilla-movimientos.xlsx');
    
      return 'plantilla-movimientos.xlsx';
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