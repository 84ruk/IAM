import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ColasService } from '../colas/colas.service';
import { ProcesadorArchivosService, ArchivoProcesado } from './servicios/procesador-archivos.service';
import { ValidadorDatosService } from './servicios/validador-datos.service';
import { TransformadorDatosService } from './servicios/transformador-datos.service';
import { PlantillasService } from './servicios/plantillas.service';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ImportarProductosDto, 
  ImportarProveedoresDto, 
  ImportarMovimientosDto 
} from './dto';
import { 
  TrabajoImportacion, 
  TipoImportacion, 
  EstadoTrabajo,
  OpcionesImportacion,
  ErrorImportacion
} from '../colas/interfaces/trabajo-importacion.interface';
import * as path from 'path';
import * as fs from 'fs';

export interface ResultadoImportacion {
  trabajoId: string;
  estado: EstadoTrabajo;
  mensaje: string;
  totalRegistros?: number;
  errores?: number;
  erroresDetallados?: ErrorImportacion[]; // Agregar errores detallados
}

@Injectable()
export class ImportacionService {
  private readonly logger = new Logger(ImportacionService.name);

  constructor(
    private readonly colasService: ColasService,
    private readonly procesadorArchivos: ProcesadorArchivosService,
    private readonly validadorDatos: ValidadorDatosService,
    private readonly transformadorDatos: TransformadorDatosService,
    private readonly plantillasService: PlantillasService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Inicia la importación de productos
   */
  async importarProductos(
    rutaArchivo: string,
    opciones: ImportarProductosDto,
    empresaId: number,
    usuarioId: number
  ): Promise<ResultadoImportacion> {
    try {
      this.logger.log(`🚀 Iniciando importación de productos para empresa ${empresaId}`);
      this.logger.log(`⚙️ Opciones: validarSolo=${opciones.validarSolo}, sobrescribirExistentes=${opciones.sobrescribirExistentes}`);

      // Procesar archivo con configuración optimizada
      const opcionesProcesamiento = {
        maxRegistros: 10000,
        columnasRequeridas: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
        validarEncabezados: true,
        ignorarFilasVacias: true, // Siempre ignorar filas vacías
        normalizarEncabezados: true,
      };
      
      this.logger.log(`📁 Procesando archivo con opciones:`, opcionesProcesamiento);
      const archivoProcesado = await this.procesadorArchivos.procesarArchivo(rutaArchivo, opcionesProcesamiento);

      this.logger.log(`🔍 Validando ${archivoProcesado.totalRegistros} registros...`);
      
      // Validar datos
      const resultadoValidacion = this.validadorDatos.validarProductos(
        archivoProcesado.datos, 
        empresaId
      );

      this.logger.log(`✅ Validación completada: ${resultadoValidacion.errores.length} errores encontrados`);
      this.logger.log(`🔍 Es válido: ${resultadoValidacion.esValido}, validarSolo: ${opciones.validarSolo}`);
      
      if (resultadoValidacion.errores.length > 0) {
        this.logger.log(`❌ Errores de validación encontrados:`);
        resultadoValidacion.errores.slice(0, 5).forEach((error, index) => {
          this.logger.log(`   ${index + 1}. Fila ${error.fila}, Columna ${error.columna}: ${error.mensaje} (Valor: "${error.valor}")`);
        });
        if (resultadoValidacion.errores.length > 5) {
          this.logger.log(`   ... y ${resultadoValidacion.errores.length - 5} errores más`);
        }
      }

      this.logger.log(`🔍 Evaluando condición: !${resultadoValidacion.esValido} && ${opciones.validarSolo} = ${!resultadoValidacion.esValido && opciones.validarSolo}`);
      
      // Si hay errores y solo se está validando, retornar los errores
      if (resultadoValidacion.errores.length > 0 && opciones.validarSolo) {
        this.logger.log(`❌ Validación fallida, retornando error...`);
        this.logger.log(`📤 Retornando errores detallados: ${resultadoValidacion.errores.length} errores`);
        
        // Agrupar errores por tipo para mejor análisis
        const erroresPorTipo = resultadoValidacion.errores.reduce((acc, error) => {
          const tipo = error.columna;
          if (!acc[tipo]) acc[tipo] = [];
          acc[tipo].push(error);
          return acc;
        }, {} as Record<string, ErrorImportacion[]>);
        
        this.logger.log(`📊 Resumen de errores por columna:`);
        Object.entries(erroresPorTipo).forEach(([columna, errores]) => {
          this.logger.log(`   - ${columna}: ${errores.length} errores`);
        });
        
        return {
          trabajoId: '',
          estado: EstadoTrabajo.ERROR,
          mensaje: `Validación fallida: ${resultadoValidacion.errores.length} errores encontrados en ${Object.keys(erroresPorTipo).length} columnas`,
          totalRegistros: archivoProcesado.totalRegistros,
          errores: resultadoValidacion.errores.length,
          erroresDetallados: resultadoValidacion.errores,
        };
      }
      
      // Si hay errores pero no es solo validación, continuar con importación parcial
      if (resultadoValidacion.errores.length > 0) {
        this.logger.log(`⚠️ Validación con errores, continuando con importación parcial...`);
        this.logger.log(`📊 Se importarán ${archivoProcesado.totalRegistros - resultadoValidacion.errores.length} registros válidos`);
      } else {
        this.logger.log(`✅ Validación superada, continuando con la importación...`);
      }

      this.logger.log(`✅ Validación superada, continuando con la importación...`);
      this.logger.log(`🔄 Transformando datos...`);
      
      // Transformar datos
      const datosTransformados = this.transformadorDatos.transformarProductos(archivoProcesado.datos);

      this.logger.log(`✅ Datos transformados exitosamente`);

      this.logger.log(`📋 Preparando trabajo de importación...`);
      
      // Crear trabajo de importación
      const opcionesImportacion: OpcionesImportacion = {
        sobrescribirExistentes: opciones.sobrescribirExistentes,
        validarSolo: opciones.validarSolo,
        notificarEmail: opciones.notificarEmail,
        emailNotificacion: opciones.emailNotificacion,
        configuracionEspecifica: opciones.configuracionEspecifica as Record<string, unknown>,
      };

      this.logger.log(`📝 Configurando opciones de importación...`);

      const trabajo: Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'> = {
        tipo: TipoImportacion.PRODUCTOS,
        empresaId,
        usuarioId,
        archivoOriginal: archivoProcesado.rutaArchivo,
        totalRegistros: archivoProcesado.totalRegistros,
        registrosProcesados: 0,
        registrosExitosos: 0,
        registrosConError: 0,
        errores: resultadoValidacion.errores,
        opciones: opcionesImportacion,
        fechaInicio: undefined,
        fechaFin: undefined,
      };

      this.logger.log(`📊 Trabajo configurado para empresa ${empresaId}, usuario ${usuarioId}, ${archivoProcesado.totalRegistros} registros`);
      this.logger.log(`📁 Ruta del archivo guardada: ${archivoProcesado.rutaArchivo}`);

      this.logger.log(`📋 Creando trabajo de importación en cola...`);
      const trabajoId = await this.colasService.crearTrabajoImportacion(trabajo);

      this.logger.log(`✅ Trabajo de importación creado: ${trabajoId}`);
      this.logger.log(`📊 Trabajo creado con ${archivoProcesado.totalRegistros} registros para empresa ${empresaId}`);

      return {
        trabajoId,
        estado: EstadoTrabajo.PENDIENTE,
        mensaje: 'Importación iniciada correctamente',
        totalRegistros: archivoProcesado.totalRegistros,
        errores: resultadoValidacion.errores.length,
      };

    } catch (error) {
      this.logger.error('❌ Error iniciando importación de productos:', error);
      throw new BadRequestException(`Error iniciando importación: ${error.message}`);
    }
  }

  /**
   * Inicia la importación de proveedores
   */
  async importarProveedores(
    rutaArchivo: string,
    opciones: ImportarProveedoresDto,
    empresaId: number,
    usuarioId: number
  ): Promise<ResultadoImportacion> {
    try {
      this.logger.log(`🚀 Iniciando importación de proveedores para empresa ${empresaId}`);

      // Procesar archivo
      const archivoProcesado = await this.procesadorArchivos.procesarArchivo(rutaArchivo, {
        maxRegistros: 5000,
        columnasRequeridas: ['nombre'],
        validarEncabezados: true,
        ignorarFilasVacias: true,
        normalizarEncabezados: true,
      });

      // Validar datos
      const resultadoValidacion = this.validadorDatos.validarProveedores(
        archivoProcesado.datos, 
        empresaId
      );

      if (!resultadoValidacion.esValido && opciones.validarSolo) {
        return {
          trabajoId: '',
          estado: EstadoTrabajo.ERROR,
          mensaje: `Validación fallida: ${resultadoValidacion.errores.length} errores encontrados`,
          totalRegistros: archivoProcesado.totalRegistros,
          errores: resultadoValidacion.errores.length,
        };
      }

      // Transformar datos
      const datosTransformados = this.transformadorDatos.transformarProveedores(archivoProcesado.datos);

      // Crear trabajo de importación
      const opcionesImportacion: OpcionesImportacion = {
        sobrescribirExistentes: opciones.sobrescribirExistentes,
        validarSolo: opciones.validarSolo,
        notificarEmail: opciones.notificarEmail,
        emailNotificacion: opciones.emailNotificacion,
        configuracionEspecifica: opciones.configuracionEspecifica as Record<string, unknown>,
      };

      const trabajo: Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'> = {
        tipo: TipoImportacion.PROVEEDORES,
        empresaId,
        usuarioId,
        archivoOriginal: archivoProcesado.rutaArchivo,
        totalRegistros: archivoProcesado.totalRegistros,
        registrosProcesados: 0,
        registrosExitosos: 0,
        registrosConError: 0,
        errores: resultadoValidacion.errores,
        opciones: opcionesImportacion,
        fechaInicio: undefined,
        fechaFin: undefined,
      };

      const trabajoId = await this.colasService.crearTrabajoImportacion(trabajo);

      this.logger.log(`✅ Trabajo de importación creado: ${trabajoId}`);

      return {
        trabajoId,
        estado: EstadoTrabajo.PENDIENTE,
        mensaje: 'Importación iniciada correctamente',
        totalRegistros: archivoProcesado.totalRegistros,
        errores: resultadoValidacion.errores.length,
      };

    } catch (error) {
      this.logger.error('❌ Error iniciando importación de proveedores:', error);
      throw new BadRequestException(`Error iniciando importación: ${error.message}`);
    }
  }

  /**
   * Inicia la importación de movimientos
   */
  async importarMovimientos(
    rutaArchivo: string,
    opciones: ImportarMovimientosDto,
    empresaId: number,
    usuarioId: number
  ): Promise<ResultadoImportacion> {
    try {
      this.logger.log(`🚀 Iniciando importación de movimientos para empresa ${empresaId}`);

      // Procesar archivo
      const archivoProcesado = await this.procesadorArchivos.procesarArchivo(rutaArchivo, {
        maxRegistros: 10000,
        columnasRequeridas: ['productoNombre', 'tipo', 'cantidad', 'fecha'],
        validarEncabezados: true,
        ignorarFilasVacias: true,
        normalizarEncabezados: true,
      });

      // Obtener productos de la empresa para validación
      const productosEmpresa = await this.obtenerProductosEmpresa(empresaId);

      // Validar datos
      const resultadoValidacion = this.validadorDatos.validarMovimientos(
        archivoProcesado.datos, 
        empresaId,
        productosEmpresa
      );

      if (!resultadoValidacion.esValido && opciones.validarSolo) {
        return {
          trabajoId: '',
          estado: EstadoTrabajo.ERROR,
          mensaje: `Validación fallida: ${resultadoValidacion.errores.length} errores encontrados`,
          totalRegistros: archivoProcesado.totalRegistros,
          errores: resultadoValidacion.errores.length,
        };
      }

      // Transformar datos
      const datosTransformados = this.transformadorDatos.transformarMovimientos(archivoProcesado.datos);

      // Crear trabajo de importación
      const opcionesImportacion: OpcionesImportacion = {
        sobrescribirExistentes: opciones.sobrescribirExistentes,
        validarSolo: opciones.validarSolo,
        notificarEmail: opciones.notificarEmail,
        emailNotificacion: opciones.emailNotificacion,
        configuracionEspecifica: opciones.configuracionEspecifica as Record<string, unknown>,
      };

      const trabajo: Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'> = {
        tipo: TipoImportacion.MOVIMIENTOS,
        empresaId,
        usuarioId,
        archivoOriginal: archivoProcesado.rutaArchivo,
        totalRegistros: archivoProcesado.totalRegistros,
        registrosProcesados: 0,
        registrosExitosos: 0,
        registrosConError: 0,
        errores: resultadoValidacion.errores,
        opciones: opcionesImportacion,
        fechaInicio: undefined,
        fechaFin: undefined,
      };

      const trabajoId = await this.colasService.crearTrabajoImportacion(trabajo);

      this.logger.log(`✅ Trabajo de importación creado: ${trabajoId}`);

      return {
        trabajoId,
        estado: EstadoTrabajo.PENDIENTE,
        mensaje: 'Importación iniciada correctamente',
        totalRegistros: archivoProcesado.totalRegistros,
        errores: resultadoValidacion.errores.length,
      };

    } catch (error) {
      this.logger.error('❌ Error iniciando importación de movimientos:', error);
      throw new BadRequestException(`Error iniciando importación: ${error.message}`);
    }
  }

  /**
   * Obtiene el estado de un trabajo de importación
   */
  async obtenerEstadoTrabajo(trabajoId: string, empresaId: number): Promise<TrabajoImportacion> {
    try {
      this.logger.log(`🔍 ImportacionService: Buscando trabajo ${trabajoId} para empresa ${empresaId}`);
      
      const trabajo = await this.colasService.obtenerTrabajoImportacion(trabajoId);
      
      if (!trabajo) {
        this.logger.warn(`⚠️ ImportacionService: Trabajo ${trabajoId} no encontrado`);
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      this.logger.log(`📋 ImportacionService: Trabajo encontrado - empresaId: ${trabajo.empresaId}, empresaId solicitada: ${empresaId}`);
      
      if (trabajo.empresaId !== empresaId) {
        this.logger.warn(`⚠️ ImportacionService: EmpresaId no coincide - trabajo: ${trabajo.empresaId}, solicitada: ${empresaId}`);
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      this.logger.log(`✅ ImportacionService: Trabajo ${trabajoId} validado correctamente`);
      this.logger.log(`📋 Trabajo completo devuelto:`, JSON.stringify(trabajo, null, 2));
      return trabajo;
    } catch (error) {
      this.logger.error(`Error obteniendo estado del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Cancela un trabajo de importación
   */
  async cancelarTrabajo(trabajoId: string, empresaId: number): Promise<void> {
    try {
      const trabajo = await this.colasService.obtenerTrabajoImportacion(trabajoId);
      
      if (!trabajo || trabajo.empresaId !== empresaId) {
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      if (trabajo.estado === EstadoTrabajo.COMPLETADO || trabajo.estado === EstadoTrabajo.ERROR) {
        throw new BadRequestException('No se puede cancelar un trabajo ya completado o con error');
      }

      await this.colasService.cancelarTrabajoImportacion(trabajoId);
      this.logger.log(`✅ Trabajo ${trabajoId} cancelado`);
    } catch (error) {
      this.logger.error(`Error cancelando trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Lista todos los trabajos de importación de una empresa
   */
  async listarTrabajos(empresaId: number, limit = 50, offset = 0): Promise<{
    trabajos: TrabajoImportacion[];
    total: number;
  }> {
    try {
      const trabajos = await this.colasService.listarTrabajosEmpresa(empresaId, limit, offset);
      const total = await this.colasService.contarTrabajosEmpresa(empresaId);

      return { trabajos, total };
    } catch (error) {
      this.logger.error(`Error listando trabajos para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Descarga el reporte de errores de un trabajo
   */
  async descargarReporteErrores(trabajoId: string, empresaId: number): Promise<string> {
    try {
      const trabajo = await this.colasService.obtenerTrabajoImportacion(trabajoId);
      
      if (!trabajo || trabajo.empresaId !== empresaId) {
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      if (!trabajo.errores || trabajo.errores.length === 0) {
        throw new BadRequestException('No hay errores para reportar');
      }

      const reportePath = await this.colasService.generarReporteErrores(trabajoId);
      return reportePath;
    } catch (error) {
      this.logger.error(`Error generando reporte de errores para trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Genera una plantilla de Excel
   */
  async generarPlantilla(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<string> {
    try {
      switch (tipo) {
        case 'productos':
          return await this.plantillasService.generarPlantillaProductos();
        case 'proveedores':
          return await this.plantillasService.generarPlantillaProveedores();
        case 'movimientos':
          return await this.plantillasService.generarPlantillaMovimientos();
        default:
          throw new BadRequestException('Tipo de plantilla no válido');
      }
    } catch (error) {
      this.logger.error(`Error generando plantilla ${tipo}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la ruta de una plantilla para descarga
   */
  obtenerRutaPlantilla(nombreArchivo: string): string {
    return this.plantillasService.obtenerRutaPlantilla(nombreArchivo);
  }

  /**
   * Lista las plantillas disponibles
   */
  listarPlantillas(): string[] {
    return this.plantillasService.listarPlantillas();
  }

  /**
   * Obtiene productos de una empresa para validación de movimientos
   */
  private async obtenerProductosEmpresa(empresaId: number): Promise<Map<string, unknown>> {
    try {
              const productos = await this.prisma.producto.findMany({
          where: {
            empresaId,
          },
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

      return mapaProductos;
    } catch (error) {
      this.logger.error(`Error obteniendo productos de empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Limpia archivos temporales
   */
  async limpiarArchivosTemporales(rutaArchivo: string): Promise<void> {
    try {
      await this.procesadorArchivos.limpiarArchivoTemporal(rutaArchivo);
    } catch (error) {
      this.logger.warn(`No se pudo limpiar archivo temporal ${rutaArchivo}:`, error);
    }
  }

  /**
   * Obtiene estadísticas de la cola de importación
   */
  async obtenerEstadisticasCola(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return await this.colasService.obtenerEstadisticasCola();
  }
} 