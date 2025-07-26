import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TrabajoImportacion, ResultadoImportacion, ErrorImportacion, EstadoTrabajo } from '../interfaces/trabajo-importacion.interface';
import * as XLSX from 'xlsx';
import * as path from 'path';

@Injectable()
export class ImportacionProveedoresProcesador {
  private readonly logger = new Logger(ImportacionProveedoresProcesador.name);

  constructor(private prisma: PrismaService) {}

  async procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    this.logger.log(`🚀 Procesando importación de proveedores: ${trabajo.archivoOriginal}`);

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
      const erroresValidacion = this.validarEstructuraArchivo(datos);
      if (erroresValidacion.length > 0) {
        resultado.errores.push(...erroresValidacion);
        resultado.estadisticas.errores = erroresValidacion.length;
        resultado.estado = EstadoTrabajo.ERROR;
        return resultado;
      }

      // 3. Procesar registros en lotes
      const loteSize = 50; // Lotes más pequeños para proveedores
      for (let i = 0; i < datos.length; i += loteSize) {
        const lote = datos.slice(i, i + loteSize);
        await this.procesarLoteProveedores(lote, trabajo, resultado, job);
        
        // Actualizar progreso usando el método nativo de BullMQ
        const progreso = Math.round(((i + loteSize) / datos.length) * 100);
        await job.updateProgress(Math.min(progreso, 100));
        // También actualizar en los datos para compatibilidad
        // NO actualizar job.data para evitar sobrescribir los datos del trabajo
      }

      // 4. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      resultado.estado = EstadoTrabajo.COMPLETADO;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      this.logger.log(`✅ Importación completada: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} proveedores`);

      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en importación de proveedores:`, error);
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

  private async leerArchivoExcel(archivoPath: string): Promise<any[]> {
    try {
      const workbook = XLSX.readFile(archivoPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Remover fila de encabezados
      const encabezados = datos[0];
      const registros = datos.slice(1);

      // Convertir a objetos con nombres de columnas
      return registros.map((fila, index) => {
        const objeto: any = {};
        (encabezados as string[]).forEach((encabezado: string, colIndex: number) => {
          objeto[encabezado] = (fila as any[])[colIndex];
        });
        return { ...objeto, _filaOriginal: index + 2 };
      });

    } catch (error) {
      throw new Error(`Error leyendo archivo Excel: ${error.message}`);
    }
  }

  private validarEstructuraArchivo(datos: any[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const columnasRequeridas = ['nombre', 'email', 'telefono'];

    if (datos.length === 0) {
      errores.push({
        fila: 1,
        columna: 'archivo',
        valor: '',
        mensaje: 'El archivo está vacío',
        tipo: 'validacion',
      });
      return errores;
    }

    // Verificar columnas requeridas en el primer registro
    const primerRegistro = datos[0];
    columnasRequeridas.forEach(columna => {
      if (!(columna in primerRegistro)) {
        errores.push({
          fila: 1,
          columna: 'estructura',
          valor: columna,
          mensaje: `Columna requerida no encontrada: ${columna}`,
          tipo: 'validacion',
        });
      }
    });

    return errores;
  }

  private async procesarLoteProveedores(
    lote: any[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job
  ): Promise<void> {
    for (const registro of lote) {
      try {
        // Validar datos del registro
        const erroresValidacion = this.validarRegistroProveedor(registro);
        if (erroresValidacion.length > 0) {
          resultado.errores.push(...erroresValidacion);
          resultado.estadisticas.errores++;
          continue;
        }

        // Verificar si el proveedor ya existe
        const proveedorExistente = await this.verificarProveedorExistente(registro, trabajo.empresaId);
        if (proveedorExistente && !trabajo.opciones.sobrescribirExistentes) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'nombre',
            valor: registro.nombre,
            mensaje: 'Proveedor ya existe y no se permite sobrescribir',
            tipo: 'duplicado',
          });
          resultado.estadisticas.duplicados++;
          continue;
        }

        // Crear o actualizar proveedor
        await this.guardarProveedor(registro, trabajo, proveedorExistente);
        resultado.estadisticas.exitosos++;

      } catch (error) {
        resultado.errores.push({
          fila: registro._filaOriginal,
          columna: 'sistema',
          valor: '',
          mensaje: `Error procesando registro: ${error.message}`,
          tipo: 'sistema',
        });
        resultado.estadisticas.errores++;
      }
    }
  }

  private validarRegistroProveedor(registro: any): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    // Validar nombre
    if (!registro.nombre || typeof registro.nombre !== 'string' || registro.nombre.trim().length === 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'nombre',
        valor: registro.nombre,
        mensaje: 'El nombre es requerido y debe ser un texto válido',
        tipo: 'validacion',
      });
    }

    // Validar email (opcional pero debe ser válido si se proporciona)
    if (registro.email && typeof registro.email === 'string' && registro.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registro.email.trim())) {
        errores.push({
          fila: registro._filaOriginal,
          columna: 'email',
          valor: registro.email,
          mensaje: 'El email debe tener un formato válido',
          tipo: 'validacion',
        });
      }
    }

    // Validar teléfono (opcional)
    if (registro.telefono && typeof registro.telefono !== 'string') {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'telefono',
        valor: registro.telefono,
        mensaje: 'El teléfono debe ser un texto válido',
        tipo: 'validacion',
      });
    }

    return errores;
  }

  private async verificarProveedorExistente(registro: any, empresaId: number): Promise<any> {
    // Buscar por nombre en la misma empresa
    return await this.prisma.proveedor.findFirst({
      where: {
        nombre: registro.nombre.trim(),
        empresaId,
        estado: 'ACTIVO' as any,
      },
    });
  }

  private async guardarProveedor(registro: any, trabajo: TrabajoImportacion, proveedorExistente: any): Promise<void> {
    const datosProveedor = {
      nombre: registro.nombre.trim(),
      email: registro.email?.trim() || null,
      telefono: registro.telefono?.trim() || null,
      empresaId: trabajo.empresaId,
              estado: 'ACTIVO' as any,
    };

    if (proveedorExistente) {
      // Actualizar proveedor existente
      await this.prisma.proveedor.update({
        where: { id: proveedorExistente.id },
        data: datosProveedor,
      });
    } else {
      // Crear nuevo proveedor
      await this.prisma.proveedor.create({
        data: datosProveedor,
      });
    }
  }

  private async generarArchivoErrores(trabajo: TrabajoImportacion, errores: ErrorImportacion[]): Promise<string> {
    const nombreArchivo = `errores-importacion-proveedores-${trabajo.id}-${Date.now()}.xlsx`;
    const rutaArchivo = path.join(process.cwd(), 'uploads', 'import', nombreArchivo);

    // Crear workbook con errores
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(errores.map(error => ({
      'Fila': error.fila,
      'Columna': error.columna,
      'Valor': error.valor,
      'Mensaje': error.mensaje,
      'Tipo': error.tipo,
    })));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errores');
    XLSX.writeFile(workbook, rutaArchivo);

    return nombreArchivo;
  }
} 