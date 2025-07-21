import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export interface ArchivoProcesado {
  datos: any[];
  encabezados: string[];
  totalRegistros: number;
  nombreArchivo: string;
  tipoArchivo: 'excel' | 'csv';
  rutaArchivo: string;
}

export interface OpcionesProcesamiento {
  maxRegistros?: number;
  columnasRequeridas?: string[];
  columnasOpcionales?: string[];
  validarEncabezados?: boolean;
  ignorarFilasVacias?: boolean;
  normalizarEncabezados?: boolean;
}

@Injectable()
export class ProcesadorArchivosService {
  private readonly logger = new Logger(ProcesadorArchivosService.name);
  private readonly maxTamanoArchivo = 50 * 1024 * 1024; // 50MB
  private readonly tiposPermitidos = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv alternativo
  ];

  /**
   * Procesa un archivo Excel o CSV y retorna los datos estructurados
   */
  async procesarArchivo(
    rutaArchivo: string,
    opciones: OpcionesProcesamiento = {}
  ): Promise<ArchivoProcesado> {
    try {
      this.logger.log(`📁 Procesando archivo: ${rutaArchivo}`);

      // Validar que el archivo existe
      if (!fs.existsSync(rutaArchivo)) {
        throw new BadRequestException('El archivo no existe');
      }

      // Validar tamaño del archivo
      const stats = fs.statSync(rutaArchivo);
      if (stats.size > this.maxTamanoArchivo) {
        throw new BadRequestException(`El archivo excede el tamaño máximo permitido (${this.maxTamanoArchivo / 1024 / 1024}MB)`);
      }

      // Determinar tipo de archivo
      const extension = path.extname(rutaArchivo).toLowerCase();
      const tipoArchivo = this.determinarTipoArchivo(extension);

      // Leer archivo según su tipo
      let datos: any[];
      let encabezados: string[];

      if (tipoArchivo === 'excel') {
        const resultado = await this.leerArchivoExcel(rutaArchivo);
        datos = resultado.datos;
        encabezados = resultado.encabezados;
      } else {
        const resultado = await this.leerArchivoCSV(rutaArchivo);
        datos = resultado.datos;
        encabezados = resultado.encabezados;
      }

      // Aplicar opciones de procesamiento
      datos = await this.aplicarOpcionesProcesamiento(datos, encabezados, opciones);

      // Validar límite de registros
      if (opciones.maxRegistros && datos.length > opciones.maxRegistros) {
        throw new BadRequestException(`El archivo excede el límite de ${opciones.maxRegistros} registros`);
      }

      // Validar columnas requeridas
      if (opciones.columnasRequeridas && opciones.validarEncabezados) {
        this.validarColumnasRequeridas(encabezados, opciones.columnasRequeridas);
      }

      const resultado: ArchivoProcesado = {
        datos,
        encabezados,
        totalRegistros: datos.length,
        nombreArchivo: path.basename(rutaArchivo),
        tipoArchivo,
        rutaArchivo,
      };

      this.logger.log(`✅ Archivo procesado: ${datos.length} registros encontrados`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error procesando archivo ${rutaArchivo}:`, error);
      throw error;
    }
  }

  /**
   * Lee un archivo Excel (.xlsx, .xls)
   */
  private async leerArchivoExcel(rutaArchivo: string): Promise<{ datos: any[]; encabezados: string[] }> {
    try {
      const workbook = XLSX.readFile(rutaArchivo, {
        cellDates: true,
        cellNF: false,
        cellText: false,
      });

      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('El archivo Excel no contiene hojas');
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON con encabezados
      const datosRaw = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
      });

      if (datosRaw.length === 0) {
        throw new BadRequestException('El archivo Excel está vacío');
      }

      // Extraer encabezados (primera fila)
      const encabezados = (datosRaw[0] as any[]).map((header: any) => 
        this.normalizarEncabezado(header?.toString() || '')
      );

      // Convertir datos a objetos
      const datos = datosRaw.slice(1).map((fila: any[], index: number) => {
        const objeto: any = { _filaOriginal: index + 2 };
        encabezados.forEach((encabezado: string, colIndex: number) => {
          objeto[encabezado] = fila[colIndex] || null;
        });
        return objeto;
      });

      return { datos, encabezados };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error leyendo archivo Excel: ${error.message}`);
    }
  }

  /**
   * Lee un archivo CSV
   */
  private async leerArchivoCSV(rutaArchivo: string): Promise<{ datos: any[]; encabezados: string[] }> {
    try {
      const contenido = await readFileAsync(rutaArchivo, 'utf-8');
      const lineas = contenido.split('\n').filter(linea => linea.trim());

      if (lineas.length === 0) {
        throw new BadRequestException('El archivo CSV está vacío');
      }

      // Detectar delimitador
      const delimitador = this.detectarDelimitador(lineas[0]);

      // Procesar encabezados
      const encabezadosRaw = lineas[0].split(delimitador);
      const encabezados = encabezadosRaw.map(header => 
        this.normalizarEncabezado(header.replace(/"/g, '').trim())
      );

      // Procesar datos
      const datos = lineas.slice(1).map((linea, index) => {
        const valores = this.parsearLineaCSV(linea, delimitador);
        const objeto: any = { _filaOriginal: index + 2 };
        
        encabezados.forEach((encabezado, colIndex) => {
          objeto[encabezado] = valores[colIndex] || null;
        });
        
        return objeto;
      });

      return { datos, encabezados };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error leyendo archivo CSV: ${error.message}`);
    }
  }

  /**
   * Aplica opciones de procesamiento a los datos
   */
  private async aplicarOpcionesProcesamiento(
    datos: any[],
    encabezados: string[],
    opciones: OpcionesProcesamiento
  ): Promise<any[]> {
    let datosProcesados = [...datos];

    // Filtrar filas vacías
    if (opciones.ignorarFilasVacias) {
      datosProcesados = datosProcesados.filter(fila => {
        return Object.values(fila).some(valor => 
          valor !== null && valor !== undefined && valor !== ''
        );
      });
    }

    // Normalizar encabezados si es necesario
    if (opciones.normalizarEncabezados) {
      datosProcesados = datosProcesados.map(fila => {
        const filaNormalizada: any = {};
        Object.keys(fila).forEach(key => {
          const keyNormalizada = this.normalizarEncabezado(key);
          filaNormalizada[keyNormalizada] = fila[key];
        });
        return filaNormalizada;
      });
    }

    return datosProcesados;
  }

  /**
   * Valida que las columnas requeridas estén presentes
   */
  private validarColumnasRequeridas(encabezados: string[], columnasRequeridas: string[]): void {
    const encabezadosNormalizados = encabezados.map(h => h.toLowerCase());
    const columnasFaltantes = columnasRequeridas.filter(columna => 
      !encabezadosNormalizados.includes(columna.toLowerCase())
    );

    if (columnasFaltantes.length > 0) {
      throw new BadRequestException(
        `Columnas requeridas faltantes: ${columnasFaltantes.join(', ')}`
      );
    }
  }

  /**
   * Normaliza un encabezado para consistencia
   */
  private normalizarEncabezado(encabezado: string): string {
    return encabezado
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Determina el tipo de archivo basado en la extensión
   */
  private determinarTipoArchivo(extension: string): 'excel' | 'csv' {
    if (['.xlsx', '.xls'].includes(extension)) {
      return 'excel';
    } else if (extension === '.csv') {
      return 'csv';
    } else {
      throw new BadRequestException(`Tipo de archivo no soportado: ${extension}`);
    }
  }

  /**
   * Detecta el delimitador de un archivo CSV
   */
  private detectarDelimitador(primeraLinea: string): string {
    const delimitadores = [',', ';', '\t', '|'];
    const conteos = delimitadores.map(del => ({
      delimitador: del,
      conteo: (primeraLinea.match(new RegExp(`\\${del}`, 'g')) || []).length
    }));

    const delimitadorMasComun = conteos.reduce((prev, current) => 
      current.conteo > prev.conteo ? current : prev
    );

    return delimitadorMasComun.delimitador;
  }

  /**
   * Parsea una línea CSV considerando comillas
   */
  private parsearLineaCSV(linea: string, delimitador: string): string[] {
    const valores: string[] = [];
    let valorActual = '';
    let dentroDeComillas = false;
    let i = 0;

    while (i < linea.length) {
      const caracter = linea[i];

      if (caracter === '"') {
        dentroDeComillas = !dentroDeComillas;
      } else if (caracter === delimitador && !dentroDeComillas) {
        valores.push(valorActual.trim());
        valorActual = '';
      } else {
        valorActual += caracter;
      }

      i++;
    }

    valores.push(valorActual.trim());
    return valores;
  }

  /**
   * Valida el tipo MIME de un archivo
   */
  validarTipoArchivo(mimetype: string): boolean {
    return this.tiposPermitidos.includes(mimetype);
  }

  /**
   * Limpia archivos temporales
   */
  async limpiarArchivoTemporal(rutaArchivo: string): Promise<void> {
    try {
      if (fs.existsSync(rutaArchivo)) {
        await unlinkAsync(rutaArchivo);
        this.logger.log(`🗑️ Archivo temporal eliminado: ${rutaArchivo}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo eliminar archivo temporal ${rutaArchivo}:`, error);
    }
  }
} 