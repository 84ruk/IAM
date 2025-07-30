import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ErrorImportacion } from '../dto/importacion-rapida.dto';

@Injectable()
export class ReporteErroresService {
  private readonly logger = new Logger(ReporteErroresService.name);

  async generarReporteDetallado(
    errores: ErrorImportacion[],
    originalFileName: string,
    estadisticas: any,
    opciones: any = {}
  ): Promise<string> {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Hoja 1: Resumen ejecutivo
      const resumenData = this.crearResumenEjecutivo(errores, estadisticas);
      const resumenSheet = XLSX.utils.json_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

      // Hoja 2: Errores detallados
      const erroresSheet = XLSX.utils.json_to_sheet(errores);
      XLSX.utils.book_append_sheet(workbook, erroresSheet, 'Errores');

      // Hoja 3: Análisis por tipo de error
      const analisisData = this.crearAnalisisPorTipo(errores);
      const analisisSheet = XLSX.utils.json_to_sheet(analisisData);
      XLSX.utils.book_append_sheet(workbook, analisisSheet, 'Análisis');

      // Hoja 4: Sugerencias de corrección
      const sugerenciasData = this.crearSugerenciasCorreccion(errores);
      const sugerenciasSheet = XLSX.utils.json_to_sheet(sugerenciasData);
      XLSX.utils.book_append_sheet(workbook, sugerenciasSheet, 'Sugerencias');

      // Generar nombre de archivo
      const timestamp = Date.now();
      const fileName = `reporte-errores-${originalFileName.replace(/\.[^/.]+$/, '')}-${timestamp}.xlsx`;
      const filePath = path.join(process.cwd(), 'uploads', 'reportes', fileName);

      // Asegurar que el directorio existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Escribir archivo
      XLSX.writeFile(workbook, filePath);

      this.logger.log(`Reporte detallado generado: ${filePath}`);

      return fileName;
    } catch (error) {
      this.logger.error(`Error generando reporte detallado: ${error.message}`);
      return '';
    }
  }

  private crearResumenEjecutivo(errores: ErrorImportacion[], estadisticas: any): any[] {
    const totalErrores = errores.length;
    const duplicados = errores.filter(e => e.tipo === 'duplicado').length;
    const validacion = errores.filter(e => e.tipo === 'validacion').length;
    const baseDatos = errores.filter(e => e.tipo === 'error_db').length;
    const formato = errores.filter(e => e.tipo === 'formato').length;

    return [
      { 'Métrica': 'Total de Errores', 'Valor': totalErrores },
      { 'Métrica': 'Errores de Duplicados', 'Valor': duplicados },
      { 'Métrica': 'Errores de Validación', 'Valor': validacion },
      { 'Métrica': 'Errores de Base de Datos', 'Valor': baseDatos },
      { 'Métrica': 'Errores de Formato', 'Valor': formato },
      { 'Métrica': 'Registros Exitosos', 'Valor': estadisticas?.exitosos || 0 },
      { 'Métrica': 'Porcentaje de Éxito', 'Valor': `${((estadisticas?.exitosos || 0) / (totalErrores + (estadisticas?.exitosos || 0)) * 100).toFixed(1)}%` },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString() }
    ];
  }

  private crearAnalisisPorTipo(errores: ErrorImportacion[]): any[] {
    const analisis: any[] = [];
    
    // Agrupar por tipo de error
    const porTipo = errores.reduce((acc, error) => {
      if (!acc[error.tipo]) {
        acc[error.tipo] = [];
      }
      acc[error.tipo].push(error);
      return acc;
    }, {} as Record<string, ErrorImportacion[]>);

    // Crear análisis para cada tipo
    Object.entries(porTipo).forEach(([tipo, erroresTipo]) => {
      analisis.push({
        'Tipo de Error': tipo,
        'Cantidad': erroresTipo.length,
        'Porcentaje': `${((erroresTipo.length / errores.length) * 100).toFixed(1)}%`,
        'Descripción': this.obtenerDescripcionTipo(tipo),
        'Acción Recomendada': this.obtenerAccionRecomendada(tipo)
      });
    });

    return analisis;
  }

  private crearSugerenciasCorreccion(errores: ErrorImportacion[]): any[] {
    const sugerencias: any[] = [];
    
    errores.forEach((error, index) => {
      sugerencias.push({
        'Fila': error.fila,
        'Columna': error.columna,
        'Valor Problemático': error.valor,
        'Error': error.mensaje,
        'Sugerencia': error.sugerencia || this.obtenerSugerenciaGenerica(error.tipo),
        'Prioridad': this.obtenerPrioridad(error.tipo)
      });
    });

    return sugerencias;
  }

  private obtenerDescripcionTipo(tipo: string): string {
    const descripciones: Record<string, string> = {
      'duplicado': 'Registro que ya existe en la base de datos',
      'validacion': 'Datos que no cumplen con las reglas de validación',
      'error_db': 'Error en la base de datos (restricciones, claves foráneas, etc.)',
      'formato': 'Error en el formato de los datos'
    };
    return descripciones[tipo] || 'Error desconocido';
  }

  private obtenerAccionRecomendada(tipo: string): string {
    const acciones: Record<string, string> = {
      'duplicado': 'Verificar si desea actualizar el registro existente o usar un identificador único',
      'validacion': 'Corregir los datos según las reglas de validación especificadas',
      'error_db': 'Verificar referencias y restricciones de la base de datos',
      'formato': 'Asegurar que los datos tengan el formato correcto'
    };
    return acciones[tipo] || 'Revisar y corregir manualmente';
  }

  private obtenerSugerenciaGenerica(tipo: string): string {
    const sugerencias: Record<string, string> = {
      'duplicado': 'Considere usar un identificador único o actualizar el registro existente',
      'validacion': 'Revise las reglas de validación y corrija los datos',
      'error_db': 'Verifique que todas las referencias existan en la base de datos',
      'formato': 'Asegúrese de que los datos tengan el formato correcto'
    };
    return sugerencias[tipo] || 'Revise y corrija el dato manualmente';
  }

  private obtenerPrioridad(tipo: string): string {
    const prioridades: Record<string, string> = {
      'duplicado': 'Media',
      'validacion': 'Alta',
      'error_db': 'Alta',
      'formato': 'Media'
    };
    return prioridades[tipo] || 'Baja';
  }
} 