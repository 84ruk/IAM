import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { ImportacionCacheService } from './importacion-cache.service';

export interface PlantillaInfo {
  nombre: string;
  tipo: string;
  ruta: string;
  tamaño: number;
  fechaModificacion: Date;
  descripcion?: string;
}

export interface PlantillasDisponibles {
  productos: PlantillaInfo[];
  proveedores: PlantillaInfo[];
  movimientos: PlantillaInfo[];
  otros: PlantillaInfo[];
}

@Injectable()
export class PlantillasAutoService implements OnModuleInit {
  private readonly logger = new Logger(PlantillasAutoService.name);
  private readonly directorioPlantillas = path.join(process.cwd(), 'uploads', 'plantillas');
  private plantillasCache: PlantillasDisponibles | null = null;
  private readonly cacheKey = 'plantillas_disponibles';

  constructor(private readonly cacheService: ImportacionCacheService) {
    this.asegurarDirectorioPlantillas();
  }

  async onModuleInit() {
    await this.inicializarPlantillas();
  }

  /**
   * Inicializa y detecta automáticamente todas las plantillas
   */
  private async inicializarPlantillas(): Promise<void> {
    try {
      this.logger.log('🔍 Inicializando detección automática de plantillas...');
      
      // Intentar obtener del cache primero
      const cached = await this.cacheService.getPlantillaCache<PlantillasDisponibles>(this.cacheKey);
      if (cached) {
        this.plantillasCache = cached;
        this.logger.log('✅ Plantillas obtenidas del cache');
        return;
      }

      // Detectar plantillas automáticamente
      const plantillas = await this.detectarPlantillas();
      this.plantillasCache = plantillas;

      // Guardar en cache
      await this.cacheService.setPlantillaCache(this.cacheKey, plantillas);

      this.logger.log(`✅ Detección completada: ${this.contarPlantillas(plantillas)} plantillas encontradas`);
      this.loggerPlantillasDetectadas(plantillas);

    } catch (error) {
      this.logger.error('❌ Error inicializando plantillas:', error);
      // Continuar con plantillas vacías
      this.plantillasCache = {
        productos: [],
        proveedores: [],
        movimientos: [],
        otros: []
      };
    }
  }

  /**
   * Detecta automáticamente todas las plantillas en el directorio
   */
  private async detectarPlantillas(): Promise<PlantillasDisponibles> {
    const plantillas: PlantillasDisponibles = {
      productos: [],
      proveedores: [],
      movimientos: [],
      otros: []
    };

    if (!fs.existsSync(this.directorioPlantillas)) {
      this.logger.warn('📁 Directorio de plantillas no existe');
      return plantillas;
    }

    const archivos = fs.readdirSync(this.directorioPlantillas)
      .filter(archivo => archivo.endsWith('.xlsx') || archivo.endsWith('.xls'))
      .filter(archivo => !archivo.startsWith('.')) // Excluir archivos ocultos
      .sort();

    this.logger.log(`📁 Archivos detectados en ${this.directorioPlantillas}:`);
    archivos.forEach(archivo => this.logger.log(`   - ${archivo}`));

    for (const archivo of archivos) {
      const rutaCompleta = path.join(this.directorioPlantillas, archivo);
      const stats = fs.statSync(rutaCompleta);
      
      const tipo = this.determinarTipoPlantilla(archivo);
      const descripcion = this.obtenerDescripcionPlantilla(archivo);
      
      this.logger.log(`🔍 Procesando: ${archivo} -> tipo: ${tipo}, descripción: ${descripcion}`);
      
      const plantillaInfo: PlantillaInfo = {
        nombre: archivo,
        tipo: tipo,
        ruta: rutaCompleta,
        tamaño: stats.size,
        fechaModificacion: stats.mtime,
        descripcion: descripcion
      };

      // Clasificar plantilla
      this.clasificarPlantilla(plantillaInfo, plantillas);
    }

    this.logger.log(`📊 Plantillas clasificadas:`);
    this.logger.log(`   Productos: ${plantillas.productos.length}`);
    this.logger.log(`   Proveedores: ${plantillas.proveedores.length}`);
    this.logger.log(`   Movimientos: ${plantillas.movimientos.length}`);
    this.logger.log(`   Otros: ${plantillas.otros.length}`);

    return plantillas;
  }

  /**
   * Determina el tipo de plantilla basado en el nombre del archivo
   */
  private determinarTipoPlantilla(nombreArchivo: string): string {
    const nombre = nombreArchivo.toLowerCase();
    
    if (nombre.includes('producto')) return 'productos';
    if (nombre.includes('proveedor')) return 'proveedores';
    if (nombre.includes('movimiento')) return 'movimientos';
    
    return 'otros';
  }

  /**
   * Obtiene una descripción de la plantilla basada en el nombre
   */
  private obtenerDescripcionPlantilla(nombreArchivo: string): string {
    const nombre = nombreArchivo.toLowerCase();
    
    if (nombre.includes('-auto')) {
      return 'Plantilla optimizada para detección automática de tipo de importación';
    }
    if (nombre.includes('electronica') || nombre.includes('software')) {
      return 'Plantilla para productos electrónicos y software';
    }
    if (nombre.includes('ropa') || nombre.includes('textil')) {
      return 'Plantilla para productos de ropa y textiles';
    }
    if (nombre.includes('farmaceutica') || nombre.includes('medicamento')) {
      return 'Plantilla para productos farmacéuticos';
    }
    if (nombre.includes('avanzada')) {
      return 'Plantilla avanzada con validaciones mejoradas';
    }
    if (nombre.includes('mejorada')) {
      return 'Plantilla mejorada con campos optimizados';
    }
    if (nombre.includes('producto')) {
      return 'Plantilla estándar para productos';
    }
    if (nombre.includes('proveedor')) {
      return 'Plantilla para proveedores';
    }
    if (nombre.includes('movimiento')) {
      return 'Plantilla para movimientos de inventario';
    }
    
    return 'Plantilla personalizada';
  }

  /**
   * Clasifica una plantilla en la categoría correspondiente
   */
  private clasificarPlantilla(plantilla: PlantillaInfo, plantillas: PlantillasDisponibles): void {
    switch (plantilla.tipo) {
      case 'productos':
        plantillas.productos.push(plantilla);
        break;
      case 'proveedores':
        plantillas.proveedores.push(plantilla);
        break;
      case 'movimientos':
        plantillas.movimientos.push(plantilla);
        break;
      default:
        plantillas.otros.push(plantilla);
        break;
    }
  }

  /**
   * Obtiene la mejor plantilla disponible para un tipo específico
   */
  async obtenerMejorPlantilla(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<PlantillaInfo | null> {
    await this.asegurarPlantillasActualizadas();
    
    const plantillas = this.plantillasCache![tipo];
    
    if (plantillas.length === 0) {
      this.logger.warn(`⚠️ No se encontraron plantillas para ${tipo}`);
      return null;
    }

    // Priorizar plantillas automáticas (para detección automática)
    const plantillaAuto = plantillas.find(p => p.nombre.includes('-auto'));
    if (plantillaAuto) {
      this.logger.log(`✅ Usando plantilla automática para ${tipo}: ${plantillaAuto.nombre}`);
      return plantillaAuto;
    }

    // Luego plantillas avanzadas
    const plantillaAvanzada = plantillas.find(p => p.nombre.includes('avanzada'));
    if (plantillaAvanzada) {
      this.logger.log(`✅ Usando plantilla avanzada para ${tipo}: ${plantillaAvanzada.nombre}`);
      return plantillaAvanzada;
    }

    // Luego plantillas mejoradas
    const plantillaMejorada = plantillas.find(p => p.nombre.includes('mejorada'));
    if (plantillaMejorada) {
      this.logger.log(`✅ Usando plantilla mejorada para ${tipo}: ${plantillaMejorada.nombre}`);
      return plantillaMejorada;
    }

    // Finalmente, la primera disponible
    const plantillaDefault = plantillas[0];
    this.logger.log(`✅ Usando plantilla por defecto para ${tipo}: ${plantillaDefault.nombre}`);
    return plantillaDefault;
  }

  /**
   * Obtiene todas las plantillas disponibles para un tipo
   */
  async obtenerPlantillasPorTipo(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<PlantillaInfo[]> {
    await this.asegurarPlantillasActualizadas();
    return this.plantillasCache![tipo];
  }

  /**
   * Obtiene todas las plantillas disponibles
   */
  async obtenerTodasLasPlantillas(): Promise<PlantillasDisponibles> {
    await this.asegurarPlantillasActualizadas();
    return this.plantillasCache!;
  }

  /**
   * Busca plantillas por criterios específicos
   */
  async buscarPlantillas(criterios: {
    tipo?: string;
    nombre?: string;
    incluirAvanzadas?: boolean;
    incluirMejoradas?: boolean;
  }): Promise<PlantillaInfo[]> {
    await this.asegurarPlantillasActualizadas();
    
    let todasLasPlantillas: PlantillaInfo[] = [];
    
    if (criterios.tipo && criterios.tipo in this.plantillasCache!) {
      todasLasPlantillas = this.plantillasCache![criterios.tipo as keyof PlantillasDisponibles];
    } else {
      todasLasPlantillas = [
        ...this.plantillasCache!.productos,
        ...this.plantillasCache!.proveedores,
        ...this.plantillasCache!.movimientos,
        ...this.plantillasCache!.otros
      ];
    }

    return todasLasPlantillas.filter(plantilla => {
      // Filtro por nombre
      if (criterios.nombre && !plantilla.nombre.toLowerCase().includes(criterios.nombre.toLowerCase())) {
        return false;
      }

      // Filtro por tipo avanzada
      if (criterios.incluirAvanzadas === false && plantilla.nombre.includes('avanzada')) {
        return false;
      }

      // Filtro por tipo mejorada
      if (criterios.incluirMejoradas === false && plantilla.nombre.includes('mejorada')) {
        return false;
      }

      return true;
    });
  }

  /**
   * Actualiza la información de plantillas
   */
  async actualizarPlantillas(): Promise<void> {
    this.logger.log('🔄 Actualizando información de plantillas...');
    
    // Limpiar cache
    await this.cacheService.clearPlantillaCache(this.cacheKey);
    this.plantillasCache = null;
    
    // Re-detectarlas
    await this.inicializarPlantillas();
    
    this.logger.log('✅ Información de plantillas actualizada');
  }

  /**
   * Verifica si una plantilla existe
   */
  async plantillaExiste(nombreArchivo: string): Promise<boolean> {
    await this.asegurarPlantillasActualizadas();
    
    const todasLasPlantillas = [
      ...this.plantillasCache!.productos,
      ...this.plantillasCache!.proveedores,
      ...this.plantillasCache!.movimientos,
      ...this.plantillasCache!.otros
    ];

    return todasLasPlantillas.some(p => p.nombre === nombreArchivo);
  }

  /**
   * Obtiene información detallada de una plantilla específica
   */
  async obtenerInfoPlantilla(nombreArchivo: string): Promise<PlantillaInfo | null> {
    await this.asegurarPlantillasActualizadas();
    
    const todasLasPlantillas = [
      ...this.plantillasCache!.productos,
      ...this.plantillasCache!.proveedores,
      ...this.plantillasCache!.movimientos,
      ...this.plantillasCache!.otros
    ];

    return todasLasPlantillas.find(p => p.nombre === nombreArchivo) || null;
  }

  /**
   * Asegura que las plantillas estén actualizadas
   */
  private async asegurarPlantillasActualizadas(): Promise<void> {
    if (!this.plantillasCache) {
      await this.inicializarPlantillas();
    }
  }

  /**
   * Cuenta el total de plantillas
   */
  private contarPlantillas(plantillas: PlantillasDisponibles): number {
    return plantillas.productos.length + 
           plantillas.proveedores.length + 
           plantillas.movimientos.length + 
           plantillas.otros.length;
  }

  /**
   * Log de plantillas detectadas
   */
  private loggerPlantillasDetectadas(plantillas: PlantillasDisponibles): void {
    this.logger.log('\n📋 Plantillas detectadas:');
    
    if (plantillas.productos.length > 0) {
      this.logger.log(`   📦 Productos (${plantillas.productos.length}):`);
      plantillas.productos.forEach(p => this.logger.log(`      - ${p.nombre}`));
    }
    
    if (plantillas.proveedores.length > 0) {
      this.logger.log(`   🏢 Proveedores (${plantillas.proveedores.length}):`);
      plantillas.proveedores.forEach(p => this.logger.log(`      - ${p.nombre}`));
    }
    
    if (plantillas.movimientos.length > 0) {
      this.logger.log(`   📊 Movimientos (${plantillas.movimientos.length}):`);
      plantillas.movimientos.forEach(p => this.logger.log(`      - ${p.nombre}`));
    }
    
    if (plantillas.otros.length > 0) {
      this.logger.log(`   📄 Otros (${plantillas.otros.length}):`);
      plantillas.otros.forEach(p => this.logger.log(`      - ${p.nombre}`));
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