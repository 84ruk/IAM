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
import { ImportacionWebSocketService } from '../../importacion/servicios/importacion-websocket.service';
import { EstrategiaImportacionFactory } from '../../importacion/factories/estrategia-importacion.factory';
import { EstrategiaImportacion, ContextoValidacion } from '../../importacion/dto/estrategias/base-estrategia.interface';
import * as XLSX from 'xlsx';
import * as path from 'path';

// Interfaces para tipos específicos
interface ProductoCache {
  id: number;
  nombre: string;
  codigoBarras?: string | null;
  stock: number;
}

interface ProveedorCache {
  id: number;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
}

@Injectable()
export class ImportacionUnificadaProcesador extends BaseProcesadorService {
  protected readonly logger = new Logger(ImportacionUnificadaProcesador.name);

  constructor(
    prisma: PrismaService,
    cacheService: ImportacionCacheService,
    private readonly estrategiaFactory: EstrategiaImportacionFactory,
    private readonly websocketService: ImportacionWebSocketService
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

    const resultado: ResultadoImportacion = {
      trabajoId: trabajo.id,
      estado: EstadoTrabajo.PROCESANDO,
      estadisticas: {
        total: 0,
        exitosos: 0,
        errores: 0,
        duplicados: 0,
        validados: 0,
        omitidos: 0,
      },
      errores: [],
      tiempoProcesamiento: 0,
      // Nuevos campos opcionales para compatibilidad
      mensajesUsuario: [],
      resumenProcesamiento: {
        duplicadosEncontrados: 0,
        erroresValidacion: 0,
        erroresSistema: 0,
        registrosOmitidos: 0,
        recomendaciones: []
      }
    };

    try {
      // 1. Leer archivo Excel
      const datos = await this.leerArchivoExcel(trabajo.archivoOriginal);
      resultado.estadisticas.total = datos.length;

      // 2. Validar estructura del archivo usando la estrategia
      const erroresEstructura = estrategia.validarEstructuraArchivo(datos);
      if (erroresEstructura.length > 0) {
        resultado.errores.push(...erroresEstructura);
        resultado.estadisticas.errores = erroresEstructura.length;
        resultado.estado = EstadoTrabajo.ERROR;
        
        // Agregar mensaje de usuario para compatibilidad
        if (resultado.mensajesUsuario) {
          resultado.mensajesUsuario.push({
            tipo: 'error',
            titulo: 'Error en la estructura del archivo',
            mensaje: `El archivo no tiene la estructura correcta. Se encontraron ${erroresEstructura.length} errores de validación.`,
            detalles: erroresEstructura.map(e => `${e.columna}: ${e.mensaje}`),
            timestamp: new Date().toISOString()
          });
        }
        
        return resultado;
      }

      // 3. Preparar contexto de validación
      const contexto = await this.prepararContextoValidacion(trabajo, estrategia);

      // 4. Transformar datos usando la estrategia
      this.logger.log(`🔄 Transformando ${datos.length} registros...`);
      const datosTransformados = await estrategia.transformarDatos(datos);
      this.logger.log(`✅ Datos transformados: ${datosTransformados.length} registros`);

      // 5. Procesar registros en lotes usando la estrategia
      this.logger.log(`🚀 Iniciando procesamiento de lotes (tamaño: ${configEstrategia.loteSize})...`);
      
      let duplicadosEncontrados = 0;
      let erroresValidacionContador = 0;
      let erroresSistemaContador = 0;
      
      for (let i = 0; i < datosTransformados.length; i += configEstrategia.loteSize) {
        const lote = datosTransformados.slice(i, i + configEstrategia.loteSize);
        this.logger.log(`📦 Procesando lote ${Math.floor(i/configEstrategia.loteSize) + 1}: ${lote.length} registros`);
        
        // Procesar lote - el método devuelve void, no necesitamos capturar resultado
        await estrategia.procesarLote(lote, trabajo, resultado, job, contexto);
        
        // Contar duplicados y errores basándonos en el resultado actualizado
        const duplicadosEnLote = resultado.errores.filter(e => e.tipo === 'duplicado').length;
        const erroresValidacionEnLote = resultado.errores.filter(e => e.tipo === 'validacion').length;
        const erroresSistemaEnLote = resultado.errores.filter(e => e.tipo === 'sistema').length;
        
        duplicadosEncontrados = duplicadosEnLote;
        erroresValidacionContador = erroresValidacionEnLote;
        erroresSistemaContador = erroresSistemaEnLote;
        
        // Actualizar progreso y contadores
        const registrosProcesados = Math.min(i + configEstrategia.loteSize, datosTransformados.length);
        const progreso = Math.round((registrosProcesados / datosTransformados.length) * 100);
        
        // Actualizar el trabajo con los contadores reales
        trabajo.registrosProcesados = registrosProcesados;
        trabajo.registrosExitosos = resultado.estadisticas.exitosos;
        trabajo.registrosConError = resultado.estadisticas.errores;
        trabajo.progreso = progreso;
        
        // Agregar mensajes informativos para el usuario (solo si existe el array)
        if (resultado.mensajesUsuario && duplicadosEncontrados > 0 && !resultado.mensajesUsuario.some(m => m.tipo === 'warning' && m.titulo.includes('Duplicados'))) {
          resultado.mensajesUsuario.push({
            tipo: 'warning',
            titulo: 'Productos duplicados encontrados',
            mensaje: `Se encontraron ${duplicadosEncontrados} productos duplicados. ${!trabajo.opciones.sobrescribirExistentes ? 'Para sobrescribirlos, activa la opción "Sobrescribir existentes".' : 'Los duplicados están siendo sobrescritos.'}`,
            detalles: [`Total de duplicados: ${duplicadosEncontrados}`, `Registros exitosos: ${resultado.estadisticas.exitosos}`, `Registros con errores: ${resultado.estadisticas.errores}`],
            timestamp: new Date().toISOString()
          });
        }
        
        // Guardar las actualizaciones en el cache para que el frontend las vea
        await this.cacheService.setTrabajoCache(trabajo.id, trabajo);
        
        // Actualizar el job con el progreso
        await job.updateProgress(Math.min(progreso, 100));
        
        // Emitir evento WebSocket de progreso actualizado
        this.websocketService.emitProgresoActualizado(
          trabajo.empresaId,
          trabajo.id,
          progreso,
          registrosProcesados,
          resultado.estadisticas.exitosos,
          resultado.estadisticas.errores,
          trabajo.estado,
          `Procesando lote ${Math.floor(i/configEstrategia.loteSize) + 1} - ${duplicadosEncontrados} duplicados encontrados`
        );
        
        this.logger.log(`📊 Progreso: ${progreso}% - Procesados: ${registrosProcesados}/${datosTransformados.length} - Exitosos: ${resultado.estadisticas.exitosos} - Errores: ${resultado.estadisticas.errores} - Duplicados: ${duplicadosEncontrados}`);
      }

      // 6. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      // Actualizar el trabajo con los contadores finales
      trabajo.registrosProcesados = datosTransformados.length;
      trabajo.registrosExitosos = resultado.estadisticas.exitosos;
      trabajo.registrosConError = resultado.estadisticas.errores;
      trabajo.progreso = 100;
      
      // Generar resumen final para el usuario (solo si existe el objeto)
      if (resultado.resumenProcesamiento) {
        resultado.resumenProcesamiento = {
          duplicadosEncontrados,
          erroresValidacion: erroresValidacionContador,
          erroresSistema: erroresSistemaContador,
          registrosOmitidos: datosTransformados.length - resultado.estadisticas.exitosos - resultado.estadisticas.errores,
          recomendaciones: this.generarRecomendaciones(resultado, trabajo, duplicadosEncontrados)
        };
      }
      
      // Agregar mensaje final según el resultado (solo si existe el array)
      if (resultado.mensajesUsuario && resultado.estadisticas.exitosos > 0) {
        resultado.mensajesUsuario.push({
          tipo: 'success',
          titulo: 'Importación completada',
          mensaje: `Se procesaron ${resultado.estadisticas.exitosos} registros exitosamente de ${datosTransformados.length} total.`,
          detalles: [
            `Registros exitosos: ${resultado.estadisticas.exitosos}`,
            `Registros con errores: ${resultado.estadisticas.errores}`,
            `Duplicados encontrados: ${duplicadosEncontrados}`,
            duplicadosEncontrados > 0 ? 'Revisa el archivo de errores para más detalles.' : ''
          ].filter(d => d),
          timestamp: new Date().toISOString()
        });
      }
      
      // Guardar el estado final en el cache
      await this.cacheService.setTrabajoCache(trabajo.id, trabajo);
      
      // Emitir evento de trabajo completado
      this.websocketService.emitTrabajoCompletado(trabajo);
      
      resultado.tiempoProcesamiento = Date.now() - inicio;

      // Determinar el estado final basado en los resultados
      if (resultado.estadisticas.exitosos === 0 && resultado.estadisticas.errores > 0) {
        // Si no se procesó ningún registro exitosamente, marcar como error
        resultado.estado = EstadoTrabajo.ERROR;
        trabajo.estado = EstadoTrabajo.ERROR;
        this.logger.warn(`⚠️ Importación unificada con errores: ${resultado.estadisticas.errores}/${resultado.estadisticas.total} registros con errores`);
      } else if (resultado.estadisticas.errores > 0) {
        // Si hay algunos errores pero también éxitos, marcar como completado con advertencia
        resultado.estado = EstadoTrabajo.COMPLETADO;
        trabajo.estado = EstadoTrabajo.COMPLETADO;
        this.logger.log(`✅ Importación unificada completada con advertencias: ${resultado.estadisticas.exitosos} exitosos, ${resultado.estadisticas.errores} con errores`);
      } else {
        // Si todo fue exitoso
        resultado.estado = EstadoTrabajo.COMPLETADO;
        trabajo.estado = EstadoTrabajo.COMPLETADO;
        this.logger.log(`✅ Importación unificada completada exitosamente: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} registros`);
      }
      
      // Guardar el estado final actualizado en el cache
      await this.cacheService.setTrabajoCache(trabajo.id, trabajo);

      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en importación unificada de ${trabajo.tipo}:`, error);
      resultado.estado = EstadoTrabajo.ERROR;
      trabajo.estado = EstadoTrabajo.ERROR;
      trabajo.mensaje = `Error del sistema: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      
      resultado.errores.push({
        fila: 0,
        columna: 'sistema',
        valor: '',
        mensaje: `Error del sistema: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        tipo: 'sistema',
      });
      
      // Agregar mensaje de error para el usuario (solo si existe el array)
      if (resultado.mensajesUsuario) {
        resultado.mensajesUsuario.push({
          tipo: 'error',
          titulo: 'Error en el procesamiento',
          mensaje: 'Ocurrió un error durante el procesamiento de la importación.',
          detalles: [error instanceof Error ? error.message : 'Error desconocido'],
          timestamp: new Date().toISOString()
        });
      }
      
      // Guardar el estado de error en el cache
      await this.cacheService.setTrabajoCache(trabajo.id, trabajo);
      
      // Emitir evento de trabajo con error
      this.websocketService.emitTrabajoError(trabajo, error instanceof Error ? error.message : 'Error desconocido');
      
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
        contexto.productosEmpresa = productosEmpresa as Map<string, ProductoCache>;
      } catch (error) {
        this.logger.warn(`No se pudieron cargar productos de la empresa ${trabajo.empresaId}:`, error);
      }
    }

    // Para productos, podríamos necesitar proveedores existentes
    if (trabajo.tipo === 'productos') {
      try {
        const proveedoresEmpresa = await this.cargarProveedoresEmpresaConCache(trabajo.empresaId);
        contexto.proveedoresEmpresa = proveedoresEmpresa as Map<string, ProveedorCache>;
      } catch (error) {
        this.logger.warn(`No se pudieron cargar proveedores de la empresa ${trabajo.empresaId}:`, error);
      }
    }

    return contexto;
  }

  /**
   * Carga productos de la empresa con cache optimizado
   */
  private async cargarProductosEmpresaConCache(empresaId: number): Promise<Map<string, ProductoCache>> {
    try {
      // Intentar obtener del cache primero
      const productosCache = await this.cacheService.getProductosEmpresaCache(empresaId);
      
      if (productosCache) {
        return productosCache as Map<string, ProductoCache>;
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

      const mapaProductos = new Map<string, ProductoCache>();
      
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
  private async cargarProveedoresEmpresaConCache(empresaId: number): Promise<Map<string, ProveedorCache>> {
    try {
      // Intentar obtener del cache primero
      // Nota: No hay método específico para proveedores, crear uno temporal
      const proveedoresCache = null; // TODO: Implementar cache de proveedores
      
      if (proveedoresCache) {
        return proveedoresCache as Map<string, ProveedorCache>;
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

      const mapaProveedores = new Map<string, ProveedorCache>();
      
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

  /**
   * Genera recomendaciones basadas en los resultados del procesamiento
   */
  private generarRecomendaciones(resultado: ResultadoImportacion, trabajo: TrabajoImportacion, duplicadosEncontrados: number): string[] {
    const recomendaciones: string[] = [];
    
    if (duplicadosEncontrados > 0 && !trabajo.opciones.sobrescribirExistentes) {
      recomendaciones.push('Activa la opción "Sobrescribir existentes" para procesar productos duplicados.');
    }
    
    if (resultado.estadisticas.errores > 0) {
      recomendaciones.push('Revisa el archivo de errores para corregir los problemas identificados.');
    }
    
    if (resultado.estadisticas.exitosos === 0) {
      recomendaciones.push('Verifica que el archivo tenga el formato correcto y los datos requeridos.');
    }
    
    if (duplicadosEncontrados > resultado.estadisticas.total * 0.5) {
      recomendaciones.push('Muchos productos están duplicados. Considera limpiar el archivo antes de importar.');
    }
    
    return recomendaciones;
  }
} 