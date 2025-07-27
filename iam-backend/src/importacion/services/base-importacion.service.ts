import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ColasService } from '../../colas/colas.service';
import { ProcesadorArchivosService } from '../servicios/procesador-archivos.service';
import { ValidadorDatosService } from '../servicios/validador-datos.service';
import { TransformadorDatosService } from '../servicios/transformador-datos.service';
import { ImportacionConfigService } from '../config/importacion.config';
import { TrabajoImportacionFactory } from '../factories/trabajo-importacion.factory';
import { BatchProcessorService } from './batch-processor.service';
import { ValidationCacheService } from './validation-cache.service';
import { ErrorHandlerService } from './error-handler.service';
import { 
  ResultadoImportacion, 
  EstadoTrabajo, 
  ErrorImportacion,
  TipoImportacion 
} from '../../colas/interfaces/trabajo-importacion.interface';
import { ImportarProductosDto, ImportarProveedoresDto, ImportarMovimientosDto } from '../dto';

export interface ProcesarImportacionParams {
  rutaArchivo: string;
  empresaId: number;
  usuarioId: number;
  tipo: 'productos' | 'proveedores' | 'movimientos';
  opciones: ImportarProductosDto | ImportarProveedoresDto | ImportarMovimientosDto;
}

@Injectable()
export abstract class BaseImportacionService {
  protected readonly logger: Logger;

  constructor(
    protected readonly colasService: ColasService,
    protected readonly procesadorArchivos: ProcesadorArchivosService,
    protected readonly validadorDatos: ValidadorDatosService,
    protected readonly transformadorDatos: TransformadorDatosService,
    protected readonly batchProcessor: BatchProcessorService,
    protected readonly validationCache: ValidationCacheService,
    protected readonly errorHandler: ErrorHandlerService,
    loggerName: string
  ) {
    this.logger = new Logger(loggerName);
  }

  protected async procesarImportacion(params: ProcesarImportacionParams): Promise<ResultadoImportacion> {
    try {
      // 1. Obtener configuración de procesamiento
      const opcionesProcesamiento = ImportacionConfigService.getOpcionesProcesamiento(params.tipo);
      
      // 2. Procesar archivo
      const archivoProcesado = await this.procesadorArchivos.procesarArchivo(
        params.rutaArchivo, 
        opcionesProcesamiento
      );
      
      // 3. Validar datos con cache optimizado
      const resultadoValidacion = await this.validarDatosOptimizado(params.tipo, archivoProcesado.datos, params.empresaId);
      
      // 4. Analizar errores con el nuevo servicio
      const errorContext = {
        empresaId: params.empresaId,
        usuarioId: params.usuarioId,
        tipoImportacion: params.tipo,
        archivo: params.rutaArchivo,
        timestamp: new Date()
      };
      
      const errorReport = this.errorHandler.analyzeErrors(resultadoValidacion.errores, errorContext);
      this.errorHandler.logErrorDetails(resultadoValidacion.errores, errorContext);
      
      // 5. Manejar validación solo
      if (resultadoValidacion.errores.length > 0 && this.esValidacionSolo(params.opciones)) {
        return this.crearResultadoValidacionSolo(resultadoValidacion, archivoProcesado.totalRegistros, errorReport);
      }
      
      // 6. Verificar si se puede continuar con errores
      const canContinue = this.errorHandler.canContinueWithErrors(
        resultadoValidacion.errores, 
        { allowPartialImport: !this.esValidacionSolo(params.opciones) }
      );
      
      if (!canContinue) {
        return this.crearResultadoValidacionSolo(resultadoValidacion, archivoProcesado.totalRegistros, errorReport);
      }
      
      // 7. Transformar datos si es necesario
      if (!this.esValidacionSolo(params.opciones)) {
        await this.transformarDatosOptimizado(params.tipo, archivoProcesado.datos);
      }

      // 6. Crear trabajo de importación
      const trabajo = this.crearTrabajo(params, archivoProcesado, resultadoValidacion.errores);
      
      // 7. Enviar a cola
      const trabajoId = await this.colasService.crearTrabajoImportacion(trabajo);

      return {
        trabajoId,
        estado: EstadoTrabajo.PENDIENTE,
        estadisticas: {
          total: archivoProcesado.totalRegistros,
          exitosos: 0,
          errores: resultadoValidacion.errores.length,
          duplicados: 0,
        },
        errores: resultadoValidacion.errores,
        tiempoProcesamiento: 0,
      };

    } catch (error) {
      this.logger.error(`Error procesando importación de ${params.tipo}:`, error);
      throw new BadRequestException(`Error procesando importación: ${error.message}`);
    }
  }

  private async validarDatosOptimizado(
    tipo: string, 
    datos: unknown[], 
    empresaId: number
  ): Promise<{ errores: ErrorImportacion[] }> {
    switch (tipo) {
      case 'productos':
        return this.validadorDatos.validarProductos(datos, empresaId);
      case 'proveedores':
        return this.validadorDatos.validarProveedores(datos, empresaId);
      case 'movimientos':
        // Usar cache para productos de la empresa
        const productosEmpresa = await this.validationCache.getProductosEmpresa(empresaId);
        return this.validadorDatos.validarMovimientos(datos, empresaId, productosEmpresa);
      default:
        throw new Error(`Tipo de validación no soportado: ${tipo}`);
    }
  }

  private async transformarDatosOptimizado(tipo: string, datos: unknown[]): Promise<void> {
    // Usar procesamiento por lotes optimizado
    const config = this.batchProcessor.getOptimizedConfig(datos.length);
    
    switch (tipo) {
      case 'productos':
        await this.batchProcessor.processBatch(
          datos,
          (item) => Promise.resolve(this.transformadorDatos.transformarProductos([item])),
          config
        );
        break;
      case 'proveedores':
        await this.batchProcessor.processBatch(
          datos,
          (item) => Promise.resolve(this.transformadorDatos.transformarProveedores([item])),
          config
        );
        break;
      case 'movimientos':
        await this.batchProcessor.processBatch(
          datos,
          (item) => Promise.resolve(this.transformadorDatos.transformarMovimientos([item])),
          config
        );
        break;
      default:
        throw new Error(`Tipo de transformación no soportado: ${tipo}`);
    }
  }

  private esValidacionSolo(opciones: ImportarProductosDto | ImportarProveedoresDto | ImportarMovimientosDto): boolean {
    return 'validarSolo' in opciones && opciones.validarSolo;
  }

  private crearResultadoValidacionSolo(
    resultadoValidacion: { errores: ErrorImportacion[] }, 
    totalRegistros: number,
    errorReport?: any
  ): ResultadoImportacion {
    const erroresPorTipo = resultadoValidacion.errores.reduce((acc, error) => {
      const tipo = error.columna;
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(error);
      return acc;
    }, {} as Record<string, ErrorImportacion[]>);

    return {
      trabajoId: '',
      estado: EstadoTrabajo.ERROR,
      estadisticas: {
        total: totalRegistros,
        exitosos: 0,
        errores: resultadoValidacion.errores.length,
        duplicados: 0,
      },
      errores: resultadoValidacion.errores,
      tiempoProcesamiento: 0,
    };
  }

  private crearTrabajo(
    params: ProcesarImportacionParams,
    archivoProcesado: { rutaArchivo: string; totalRegistros: number },
    errores: ErrorImportacion[]
  ) {
    switch (params.tipo) {
      case 'productos':
        return TrabajoImportacionFactory.crearTrabajoProductos(
          params.empresaId,
          params.usuarioId,
          archivoProcesado.rutaArchivo,
          archivoProcesado.totalRegistros,
          errores,
          params.opciones as ImportarProductosDto
        );
      case 'proveedores':
        return TrabajoImportacionFactory.crearTrabajoProveedores(
          params.empresaId,
          params.usuarioId,
          archivoProcesado.rutaArchivo,
          archivoProcesado.totalRegistros,
          errores,
          params.opciones as ImportarProveedoresDto
        );
      case 'movimientos':
        return TrabajoImportacionFactory.crearTrabajoMovimientos(
          params.empresaId,
          params.usuarioId,
          archivoProcesado.rutaArchivo,
          archivoProcesado.totalRegistros,
          errores,
          params.opciones as ImportarMovimientosDto
        );
      default:
        throw new Error(`Tipo de trabajo no soportado: ${params.tipo}`);
    }
  }
} 