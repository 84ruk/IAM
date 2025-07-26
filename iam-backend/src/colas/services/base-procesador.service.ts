import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ErrorImportacion, 
  EstadoTrabajo,
  RegistroImportacion,
  DatosExcel
} from '../interfaces/trabajo-importacion.interface';
import { 
  BaseProcesadorInterface, 
  ProcesadorConfig, 
  LoteProcesador 
} from '../interfaces/base-procesador.interface';
import * as XLSX from 'xlsx';
import * as path from 'path';

@Injectable()
export abstract class BaseProcesadorService implements BaseProcesadorInterface {
  protected readonly logger: Logger;
  protected readonly config: ProcesadorConfig;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly cacheService: ImportacionCacheService,
    loggerName: string,
    config: Partial<ProcesadorConfig> = {}
  ) {
    this.logger = new Logger(loggerName);
    this.config = {
      loteSize: 100,
      maxRetries: 3,
      timeout: 30000,
      enableCache: true,
      cacheTTL: 1800,
      ...config
    };
  }

  abstract procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion>;

  protected async procesarArchivoBase(
    trabajo: TrabajoImportacion, 
    job: Job,
    loteProcesador: LoteProcesador
  ): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    this.logger.log(`🚀 Procesando importación: ${trabajo.archivoOriginal}`);
    this.logger.log(`📁 Ruta completa del archivo: ${trabajo.archivoOriginal}`);

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

      // 2. Validar estructura del archivo
      const erroresValidacion = this.validarEstructuraArchivoBase(datos);
      if (erroresValidacion.length > 0) {
        resultado.errores.push(...erroresValidacion);
        resultado.estadisticas.errores = erroresValidacion.length;
        resultado.estado = EstadoTrabajo.ERROR;
        return resultado;
      }

      // 3. Procesar registros en lotes
      for (let i = 0; i < datos.length; i += this.config.loteSize) {
        const lote = datos.slice(i, i + this.config.loteSize);
        await loteProcesador.procesarLote(lote, trabajo, resultado, job);
        
        // Actualizar progreso usando el método nativo de BullMQ
        const progreso = Math.round(((i + this.config.loteSize) / datos.length) * 100);
        await job.updateProgress(Math.min(progreso, 100));
        // NO actualizar job.data para evitar sobrescribir los datos del trabajo
      }

      // 4. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      resultado.estado = EstadoTrabajo.COMPLETADO;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      this.logger.log(`✅ Importación completada: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} registros`);

      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en importación:`, error);
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

  protected async leerArchivoExcel(archivoPath: string): Promise<RegistroImportacion[]> {
    try {
      this.logger.log(`📖 Leyendo archivo Excel: ${archivoPath}`);
      
      const workbook = XLSX.readFile(archivoPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Remover fila de encabezados
      const encabezados = datos[0] as string[];
      const registros = datos.slice(1);

      this.logger.log(`📋 Encabezados encontrados:`, encabezados);
      this.logger.log(`📊 Número de registros: ${registros.length}`);

      // Normalizar encabezados
      const encabezadosNormalizados = encabezados.map(encabezado => this.normalizarNombreColumna(encabezado));
      this.logger.log(`📋 Encabezados normalizados:`, encabezadosNormalizados);

      // Convertir a objetos con nombres de columnas normalizados
      const resultado = registros.map((fila: unknown[], index: number) => {
        const objeto: Record<string, unknown> = {};
        encabezados.forEach((encabezado: string, colIndex: number) => {
          const nombreNormalizado = this.normalizarNombreColumna(encabezado);
          objeto[nombreNormalizado] = fila[colIndex];
        });
        const registro = { ...objeto, _filaOriginal: index + 2 } as RegistroImportacion;
        
        // Log del primer registro para debugging
        if (index === 0) {
          this.logger.log(`📋 Primer registro procesado:`, JSON.stringify(registro, null, 2));
        }
        
        return registro;
      });

      this.logger.log(`✅ Archivo procesado exitosamente: ${resultado.length} registros`);
      return resultado;
    } catch (error) {
      this.logger.error(`Error leyendo archivo Excel: ${archivoPath}`, error);
      throw new Error(`Error leyendo archivo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Normaliza el nombre de una columna para que coincida con los campos esperados
   */
  private normalizarNombreColumna(encabezado: string): string {
    if (!encabezado) return encabezado;
    
    // Remover espacios al inicio y final
    let normalizado = encabezado.trim();
    
    // Mapeo específico de nombres de columnas
    const mapeoColumnas: Record<string, string> = {
      'nombre': 'nombre',
      'Nombre': 'nombre',
      'NOMBRE': 'nombre',
      
      'descripcion': 'descripcion',
      'Descripción': 'descripcion',
      'Descripcion': 'descripcion',
      'DESCRIPCIÓN': 'descripcion',
      
      'stock': 'stock',
      'Stock': 'stock',
      'Stock ': 'stock', // Con espacio al final
      'STOCK': 'stock',
      
      'precioCompra': 'precioCompra',
      'Precio Compra': 'precioCompra',
      'Precio de Compra': 'precioCompra',
      'PRECIO COMPRA': 'precioCompra',
      
      'precioVenta': 'precioVenta',
      'Precio Venta': 'precioVenta',
      'Precio de Venta': 'precioVenta',
      'PRECIO VENTA': 'precioVenta',
      
      'stockMinimo': 'stockMinimo',
      'Stock Mínimo': 'stockMinimo',
      'Stock Minimo': 'stockMinimo',
      'Stock Mínimo ': 'stockMinimo', // Con espacio al final
      'STOCK MÍNIMO': 'stockMinimo',
      
      'tipoProducto': 'tipoProducto',
      'Tipo Producto': 'tipoProducto',
      'Tipo Producto *': 'tipoProducto', // Con asterisco
      'TIPO PRODUCTO': 'tipoProducto',
      
      'unidad': 'unidad',
      'Unidad': 'unidad',
      'Unidad ': 'unidad', // Con espacio al final
      'UNIDAD': 'unidad',
      
      'estado': 'estado',
      'Estado': 'estado',
      'ESTADO': 'estado',
      
      'codigoBarras': 'codigoBarras',
      'Código Barras': 'codigoBarras',
      'Codigo Barras': 'codigoBarras',
      'CÓDIGO BARRAS': 'codigoBarras',
      
      'sku': 'sku',
      'SKU': 'sku',
      
      'etiquetas': 'etiquetas',
      'Etiquetas': 'etiquetas',
      'ETIQUETAS': 'etiquetas',
      
      'marca': 'marca',
      'Marca': 'marca',
      'MARCA': 'marca',
      
      'modelo': 'modelo',
      'Modelo': 'modelo',
      'MODELO': 'modelo',
      
      'especificacionesTecnicas': 'especificacionesTecnicas',
      'Especificaciones Técnicas': 'especificacionesTecnicas',
      'Especificaciones Tecnicas': 'especificacionesTecnicas',
      'ESPECIFICACIONES TÉCNICAS': 'especificacionesTecnicas',
      
      'ubicacion': 'ubicacion',
      'Ubicación': 'ubicacion',
      'Ubicacion': 'ubicacion',
      'UBICACIÓ': 'ubicacion',
      
      'temperaturaOptima': 'temperaturaOptima',
      'Temperatura Óptima': 'temperaturaOptima',
      'Temperatura Optima': 'temperaturaOptima',
      'TEMPERATURA ÓPTIMA': 'temperaturaOptima',
      
      'humedadOptima': 'humedadOptima',
      'Humedad Óptima': 'humedadOptima',
      'Humedad Optima': 'humedadOptima',
      'HUMEDAD ÓPTIMA': 'humedadOptima',
    };
    
    // Buscar en el mapeo
    if (mapeoColumnas[normalizado]) {
      return mapeoColumnas[normalizado];
    }
    
    // Si no está en el mapeo, normalizar de forma genérica
    return normalizado
      .toLowerCase()
      .replace(/[áéíóúüñ]/g, (match) => {
        const mapa: Record<string, string> = {
          'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
        };
        return mapa[match] || match;
      })
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
  }

  protected validarEstructuraArchivoBase(datos: RegistroImportacion[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    if (!datos || datos.length === 0) {
      errores.push({
        fila: 0,
        columna: 'archivo',
        valor: '',
        mensaje: 'El archivo está vacío o no contiene datos válidos',
        tipo: 'validacion',
      });
      return errores;
    }

    // Validar que al menos el primer registro tenga datos
    const primerRegistro = datos[0];
    if (!primerRegistro || Object.keys(primerRegistro).length === 0) {
      errores.push({
        fila: 1,
        columna: 'datos',
        valor: '',
        mensaje: 'El archivo no contiene registros válidos',
        tipo: 'validacion',
      });
    }

    return errores;
  }

  protected async generarArchivoErrores(trabajo: TrabajoImportacion, errores: ErrorImportacion[]): Promise<string> {
    try {
      const timestamp = Date.now();
      const nombreArchivo = `errores-${trabajo.tipo}-${timestamp}.xlsx`;
      const rutaArchivo = path.join(process.cwd(), 'uploads', 'reportes', nombreArchivo);

      // Crear directorio si no existe
      const dir = path.dirname(rutaArchivo);
      if (!require('fs').existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
      }

      // Crear workbook con errores
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(errores);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Errores');
      XLSX.writeFile(workbook, rutaArchivo);

      this.logger.log(`📄 Archivo de errores generado: ${rutaArchivo}`);
      return rutaArchivo;
    } catch (error) {
      this.logger.error('Error generando archivo de errores:', error);
      throw error;
    }
  }

  protected async procesarConRetry<T>(
    operacion: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error = new Error('Operación falló después de todos los intentos');
    
    for (let intento = 1; intento <= maxRetries; intento++) {
      try {
        return await operacion();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Intento ${intento}/${maxRetries} falló:`, lastError.message);
        
        if (intento < maxRetries) {
          await this.delay(Math.pow(2, intento) * 1000); // Backoff exponencial
        }
      }
    }
    
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}