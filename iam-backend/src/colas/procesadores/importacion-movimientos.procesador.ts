import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TrabajoImportacion, ResultadoImportacion, ErrorImportacion, EstadoTrabajo } from '../interfaces/trabajo-importacion.interface';
import * as XLSX from 'xlsx';
import * as path from 'path';

@Injectable()
export class ImportacionMovimientosProcesador {
  private readonly logger = new Logger(ImportacionMovimientosProcesador.name);

  constructor(private prisma: PrismaService) {}

  async procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion> {
    const inicio = Date.now();
    this.logger.log(`🚀 Procesando importación de movimientos: ${trabajo.archivoOriginal}`);

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

      // 3. Cargar productos de la empresa para validación
      const productosEmpresa = await this.cargarProductosEmpresa(trabajo.empresaId);

      // 4. Procesar registros en lotes
      const loteSize = 50; // Lotes más pequeños para movimientos
      for (let i = 0; i < datos.length; i += loteSize) {
        const lote = datos.slice(i, i + loteSize);
        await this.procesarLoteMovimientos(lote, trabajo, resultado, job, productosEmpresa);
        
        // Actualizar progreso
        const progreso = Math.round(((i + loteSize) / datos.length) * 100);
        await job.updateProgress(Math.min(progreso, 100));
      }

      // 5. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      resultado.estado = EstadoTrabajo.COMPLETADO;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      this.logger.log(`✅ Importación completada: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} movimientos`);

      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en importación de movimientos:`, error);
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
    const columnasRequeridas = ['productoNombre', 'tipo', 'cantidad', 'fecha'];

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

  private async cargarProductosEmpresa(empresaId: number): Promise<Map<string, any>> {
    const productos = await this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
      },
      select: {
        id: true,
        nombre: true,
        stock: true,
        codigoBarras: true,
        sku: true,
      },
    });

    const productosMap = new Map<string, any>();
    productos.forEach(producto => {
      productosMap.set(producto.nombre.toLowerCase().trim(), producto);
      if (producto.codigoBarras) {
        productosMap.set(producto.codigoBarras.trim(), producto);
      }
      if (producto.sku) {
        productosMap.set(producto.sku.trim(), producto);
      }
    });

    return productosMap;
  }

  private async procesarLoteMovimientos(
    lote: any[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job,
    productosEmpresa: Map<string, any>
  ): Promise<void> {
    for (const registro of lote) {
      try {
        // Validar datos del registro
        const erroresValidacion = this.validarRegistroMovimiento(registro, productosEmpresa);
        if (erroresValidacion.length > 0) {
          resultado.errores.push(...erroresValidacion);
          resultado.estadisticas.errores++;
          continue;
        }

        // Obtener producto
        const producto = productosEmpresa.get(registro.productoNombre.toLowerCase().trim()) ||
                        productosEmpresa.get(registro.productoNombre.trim()) ||
                        productosEmpresa.get(registro.codigoBarras?.trim());

        if (!producto) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'productoNombre',
            valor: registro.productoNombre,
            mensaje: 'Producto no encontrado en la empresa',
            tipo: 'referencia',
          });
          resultado.estadisticas.errores++;
          continue;
        }

        // Validar stock disponible para salidas
        if (registro.tipo === 'SALIDA' && producto.stock < parseInt(registro.cantidad)) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'cantidad',
            valor: registro.cantidad,
            mensaje: `Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${registro.cantidad}`,
            tipo: 'validacion',
          });
          resultado.estadisticas.errores++;
          continue;
        }

        // Crear movimiento
        await this.crearMovimiento(registro, trabajo, producto);
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

  private validarRegistroMovimiento(registro: any, productosEmpresa: Map<string, any>): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    // Validar nombre del producto
    if (!registro.productoNombre || typeof registro.productoNombre !== 'string' || registro.productoNombre.trim().length === 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'productoNombre',
        valor: registro.productoNombre,
        mensaje: 'El nombre del producto es requerido',
        tipo: 'validacion',
      });
    }

    // Validar tipo de movimiento
    const tipo = registro.tipo?.toUpperCase();
    if (!tipo || !['ENTRADA', 'SALIDA'].includes(tipo)) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'tipo',
        valor: registro.tipo,
        mensaje: 'El tipo debe ser ENTRADA o SALIDA',
        tipo: 'validacion',
      });
    }

    // Validar cantidad
    const cantidad = parseInt(registro.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'cantidad',
        valor: registro.cantidad,
        mensaje: 'La cantidad debe ser un número entero mayor a 0',
        tipo: 'validacion',
      });
    }

    // Validar fecha
    const fecha = new Date(registro.fecha);
    if (isNaN(fecha.getTime())) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'fecha',
        valor: registro.fecha,
        mensaje: 'La fecha debe tener un formato válido (YYYY-MM-DD)',
        tipo: 'validacion',
      });
    }

    return errores;
  }

  private async crearMovimiento(registro: any, trabajo: TrabajoImportacion, producto: any): Promise<void> {
    const cantidad = parseInt(registro.cantidad);
    const tipo = registro.tipo.toUpperCase();
    const fecha = new Date(registro.fecha);

    // Crear el movimiento
    await this.prisma.movimientoInventario.create({
      data: {
        cantidad,
        productoId: producto.id,
        fecha,
        tipo,
        motivo: registro.motivo?.trim() || null,
        descripcion: registro.descripcion?.trim() || null,
        empresaId: trabajo.empresaId,
        estado: 'ACTIVO',
      },
    });

    // Actualizar stock del producto
    const nuevoStock = tipo === 'ENTRADA' ? producto.stock + cantidad : producto.stock - cantidad;
    await this.prisma.producto.update({
      where: { id: producto.id },
      data: { stock: nuevoStock },
    });
  }

  private async generarArchivoErrores(trabajo: TrabajoImportacion, errores: ErrorImportacion[]): Promise<string> {
    const nombreArchivo = `errores-importacion-movimientos-${trabajo.id}-${Date.now()}.xlsx`;
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