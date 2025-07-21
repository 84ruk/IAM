import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TrabajoImportacion, ResultadoImportacion, ErrorImportacion, EstadoTrabajo } from '../interfaces/trabajo-importacion.interface';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportacionProductosProcesador {
  private readonly logger = new Logger(ImportacionProductosProcesador.name);

  constructor(private prisma: PrismaService) {}

  async procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    this.logger.log(`🚀 Procesando importación de productos: ${trabajo.archivoOriginal}`);

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
      const loteSize = 100;
      for (let i = 0; i < datos.length; i += loteSize) {
        const lote = datos.slice(i, i + loteSize);
        await this.procesarLoteProductos(lote, trabajo, resultado, job);
        
        // Actualizar progreso
        const progreso = Math.round(((i + loteSize) / datos.length) * 100);
        await job.updateProgress(Math.min(progreso, 100));
      }

      // 4. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      resultado.estado = EstadoTrabajo.COMPLETADO;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      this.logger.log(`✅ Importación completada: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} productos`);

      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en importación de productos:`, error);
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
        return { ...objeto, _filaOriginal: index + 2 }; // +2 porque index empieza en 0 y removimos encabezados
      });

    } catch (error) {
      throw new Error(`Error leyendo archivo Excel: ${error.message}`);
    }
  }

  private validarEstructuraArchivo(datos: any[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const columnasRequeridas = ['nombre', 'descripcion', 'stock', 'precioCompra', 'precioVenta', 'stockMinimo'];

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

  private async procesarLoteProductos(
    lote: any[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job
  ): Promise<void> {
    for (const registro of lote) {
      try {
        // Validar datos del registro
        const erroresValidacion = this.validarRegistroProducto(registro);
        if (erroresValidacion.length > 0) {
          resultado.errores.push(...erroresValidacion);
          resultado.estadisticas.errores++;
          continue;
        }

        // Verificar si el producto ya existe
        const productoExistente = await this.verificarProductoExistente(registro, trabajo.empresaId);
        if (productoExistente && !trabajo.opciones.sobrescribirExistentes) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'nombre',
            valor: registro.nombre,
            mensaje: 'Producto ya existe y no se permite sobrescribir',
            tipo: 'duplicado',
          });
          resultado.estadisticas.duplicados++;
          continue;
        }

        // Crear o actualizar producto
        await this.guardarProducto(registro, trabajo, productoExistente);
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

  private validarRegistroProducto(registro: any): ErrorImportacion[] {
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

    // Validar stock
    const stock = parseInt(registro.stock);
    if (isNaN(stock) || stock < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'stock',
        valor: registro.stock,
        mensaje: 'El stock debe ser un número entero mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    // Validar precios
    const precioCompra = parseFloat(registro.precioCompra);
    const precioVenta = parseFloat(registro.precioVenta);
    
    if (isNaN(precioCompra) || precioCompra < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'precioCompra',
        valor: registro.precioCompra,
        mensaje: 'El precio de compra debe ser un número válido mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    if (isNaN(precioVenta) || precioVenta < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'precioVenta',
        valor: registro.precioVenta,
        mensaje: 'El precio de venta debe ser un número válido mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    // Validar stock mínimo
    const stockMinimo = parseInt(registro.stockMinimo);
    if (isNaN(stockMinimo) || stockMinimo < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'stockMinimo',
        valor: registro.stockMinimo,
        mensaje: 'El stock mínimo debe ser un número entero mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    return errores;
  }

  private async verificarProductoExistente(registro: any, empresaId: number): Promise<any> {
    // Buscar por nombre en la misma empresa
    return await this.prisma.producto.findFirst({
      where: {
        nombre: registro.nombre.trim(),
        empresaId,
        estado: 'ACTIVO' as any,
      },
    });
  }

  private async guardarProducto(registro: any, trabajo: TrabajoImportacion, productoExistente: any): Promise<void> {
    const datosProducto = {
      nombre: registro.nombre.trim(),
      descripcion: registro.descripcion?.trim() || null,
      stock: parseInt(registro.stock) || 0,
      precioCompra: parseFloat(registro.precioCompra) || 0,
      precioVenta: parseFloat(registro.precioVenta) || 0,
      stockMinimo: parseInt(registro.stockMinimo) || 10,
      empresaId: trabajo.empresaId,
      tipoProducto: registro.tipoProducto || 'GENERICO',
      unidad: registro.unidad || 'UNIDAD',
              estado: 'ACTIVO' as any,
      etiquetas: registro.etiquetas ? registro.etiquetas.split(',').map((tag: string) => tag.trim()) : [],
    };

    if (productoExistente) {
      // Actualizar producto existente
      await this.prisma.producto.update({
        where: { id: productoExistente.id },
        data: datosProducto,
      });
    } else {
      // Crear nuevo producto
      await this.prisma.producto.create({
        data: datosProducto,
      });
    }
  }

  private async generarArchivoErrores(trabajo: TrabajoImportacion, errores: ErrorImportacion[]): Promise<string> {
    const nombreArchivo = `errores-importacion-${trabajo.id}-${Date.now()}.xlsx`;
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