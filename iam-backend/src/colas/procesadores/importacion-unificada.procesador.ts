import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ErrorImportacion,
  EstadoTrabajo,
  RegistroImportacion 
} from '../interfaces/trabajo-importacion.interface';
import { BaseProcesadorService } from '../services/base-procesador.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { EstrategiaImportacionFactory } from '../../importacion/factories/estrategia-importacion.factory';
import { EstrategiaImportacion, ContextoValidacion } from '../../importacion/dto/estrategias/base-estrategia.interface';
import * as XLSX from 'xlsx';
import * as path from 'path';

@Injectable()
export class ImportacionUnificadaProcesador extends BaseProcesadorService {
  protected readonly logger = new Logger(ImportacionUnificadaProcesador.name);

  constructor(
    prisma: PrismaService,
    cacheService: ImportacionCacheService,
    private readonly estrategiaFactory: EstrategiaImportacionFactory
  ) {
    super(prisma, cacheService, 'ImportacionUnificadaProcesador', {
      loteSize: 100,
      maxRetries: 3,
      timeout: 30000,
      enableCache: true,
      cacheTTL: 1800,
    });
  }

  async procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    this.logger.log(`🚀 Procesando importación unificada de ${trabajo.tipo}: ${trabajo.archivoOriginal}`);

    // Obtener la estrategia específica para este tipo
    const estrategia = this.estrategiaFactory.crearEstrategia(trabajo.tipo);
    
    // Configurar el procesador con la configuración específica de la estrategia
    const configEstrategia = estrategia.obtenerConfiguracionProcesamiento();
    // Usar la configuración de la estrategia directamente sin modificar this.config

    const resultado: ResultadoImportacion = {
      trabajoId: trabajo.id,
      estado: EstadoTrabajo.PROCESANDO,
      estadisticas: {
        total: 0,
        exitosos: 0,
        errores: 0,
        duplicados: 0,
      },
      errores: [],
      tiempoProcesamiento: 0,
    };

    try {
      // 1. Leer archivo Excel
      const datos = await this.leerArchivoExcel(trabajo.archivoOriginal);
      resultado.estadisticas.total = datos.length;

      // 2. Validar estructura del archivo usando la estrategia
      const erroresValidacion = estrategia.validarEstructuraArchivo(datos);
      if (erroresValidacion.length > 0) {
        resultado.errores.push(...erroresValidacion);
        resultado.estadisticas.errores = erroresValidacion.length;
        resultado.estado = EstadoTrabajo.ERROR;
        return resultado;
      }

      // 3. Preparar contexto de validación
      const contexto = await this.prepararContextoValidacion(trabajo, estrategia);

      // 4. Transformar datos usando la estrategia
      const datosTransformados = await estrategia.transformarDatos(datos);

      // 5. Procesar registros en lotes usando la estrategia
      for (let i = 0; i < datosTransformados.length; i += configEstrategia.loteSize) {
        const lote = datosTransformados.slice(i, i + configEstrategia.loteSize);
        await estrategia.procesarLote(lote, trabajo, resultado, job, contexto);
        
        // Actualizar progreso
        const progreso = Math.round(((i + configEstrategia.loteSize) / datosTransformados.length) * 100);
        await job.updateProgress(Math.min(progreso, 100));
      }

      // 6. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      resultado.estado = EstadoTrabajo.COMPLETADO;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      this.logger.log(`✅ Importación unificada completada: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} registros`);

      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en importación unificada de ${trabajo.tipo}:`, error);
      resultado.estado = EstadoTrabajo.ERROR;
      resultado.errores.push({
        fila: 0,
        columna: 'sistema',
        valor: '',
        mensaje: `Error del sistema: ${error.message}`,
        tipo: 'sistema',
      });
      return resultado;
    }
  }

  /**
   * Prepara el contexto de validación según el tipo de importación
   */
  private async prepararContextoValidacion(
    trabajo: TrabajoImportacion, 
    estrategia: EstrategiaImportacion
  ): Promise<ContextoValidacion> {
    const contexto: ContextoValidacion = {
      empresaId: trabajo.empresaId,
      configuracion: trabajo.opciones.configuracionEspecifica,
    };

    // Para movimientos, necesitamos cargar los productos de la empresa
    if (trabajo.tipo === 'movimientos') {
      try {
        const productosEmpresa = await this.cargarProductosEmpresaConCache(trabajo.empresaId);
        contexto.productosEmpresa = productosEmpresa;
      } catch (error) {
        this.logger.warn(`No se pudieron cargar productos de la empresa ${trabajo.empresaId}:`, error);
      }
    }

    // Para productos, podríamos necesitar proveedores existentes
    if (trabajo.tipo === 'productos') {
      try {
        const proveedoresEmpresa = await this.cargarProveedoresEmpresaConCache(trabajo.empresaId);
        contexto.proveedoresEmpresa = proveedoresEmpresa;
      } catch (error) {
        this.logger.warn(`No se pudieron cargar proveedores de la empresa ${trabajo.empresaId}:`, error);
      }
    }

    return contexto;
  }

  /**
   * Carga productos de la empresa con cache optimizado
   */
  private async cargarProductosEmpresaConCache(empresaId: number): Promise<Map<string, any>> {
    try {
      // Intentar obtener del cache primero
      const productosCache = await this.cacheService.getProductosEmpresaCache(empresaId);
      
      if (productosCache) {
        return productosCache;
      }

      // Si no está en cache, cargar de la base de datos
      const productos = await this.prisma.producto.findMany({
        where: { empresaId },
        select: {
          id: true,
          nombre: true,
          codigoBarras: true,
          stock: true,
        },
      });

      const mapaProductos = new Map<string, any>();
      
      productos.forEach(producto => {
        // Mapear por nombre (normalizado)
        const nombreNormalizado = producto.nombre.toLowerCase().trim();
        mapaProductos.set(nombreNormalizado, producto);
        
        // Mapear por código de barras si existe
        if (producto.codigoBarras) {
          mapaProductos.set(producto.codigoBarras, producto);
        }
      });

      // Guardar en cache
      await this.cacheService.setProductosEmpresaCache(empresaId, mapaProductos);

      return mapaProductos;
    } catch (error) {
      this.logger.error(`Error cargando productos de empresa ${empresaId}:`, error);
      return new Map();
    }
  }

  /**
   * Carga proveedores de la empresa con cache optimizado
   */
  private async cargarProveedoresEmpresaConCache(empresaId: number): Promise<Map<string, any>> {
    try {
      // Intentar obtener del cache primero
      // Nota: No hay método específico para proveedores, crear uno temporal
      const proveedoresCache = null; // TODO: Implementar cache de proveedores
      
      if (proveedoresCache) {
        return proveedoresCache;
      }

      // Si no está en cache, cargar de la base de datos
      const proveedores = await this.prisma.proveedor.findMany({
        where: { empresaId },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
        },
      });

      const mapaProveedores = new Map<string, any>();
      
      proveedores.forEach(proveedor => {
        // Mapear por nombre (normalizado)
        const nombreNormalizado = proveedor.nombre.toLowerCase().trim();
        mapaProveedores.set(nombreNormalizado, proveedor);
        
        // Mapear por email si existe
        if (proveedor.email) {
          mapaProveedores.set(proveedor.email.toLowerCase(), proveedor);
        }
        
        // Mapear por teléfono si existe
        if (proveedor.telefono) {
          mapaProveedores.set(proveedor.telefono, proveedor);
        }
      });

      // Guardar en cache
      // TODO: Implementar cache de proveedores
      // await this.cacheService.setProveedoresEmpresaCache(empresaId, mapaProveedores);

      return mapaProveedores;
    } catch (error) {
      this.logger.error(`Error cargando proveedores de empresa ${empresaId}:`, error);
      return new Map();
    }
  }

  /**
   * Obtiene información de las estrategias disponibles
   */
  obtenerInformacionEstrategias() {
    return this.estrategiaFactory.obtenerInformacionEstrategias();
  }

  /**
   * Verifica si un tipo de importación es soportado
   */
  esTipoSoportado(tipo: string): boolean {
    return this.estrategiaFactory.esTipoSoportado(tipo);
  }
} 