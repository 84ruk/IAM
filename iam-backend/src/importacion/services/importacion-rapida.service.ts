import { Injectable, Logger } from '@nestjs/common';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { ResultadoImportacionRapida } from '../dto/importacion-rapida.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportacionRapidaService {
  private readonly logger = new Logger(ImportacionRapidaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async procesarImportacionRapida(
    file: Express.Multer.File,
    tipo: string,
    user: JwtUser,
  ): Promise<ResultadoImportacionRapida> {
    this.logger.log(`Procesando importación rápida - Tipo: ${tipo}, Archivo: ${file.originalname}`);

    try {
      // Leer archivo
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        throw new Error('El archivo no contiene datos válidos');
      }

      // Extraer headers y datos
      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];

      this.logger.log(`Archivo leído - Headers: ${headers.length}, Filas: ${rows.length}`);

      // Procesar según el tipo
      let resultado: ResultadoImportacionRapida;

      switch (tipo) {
        case 'productos':
          resultado = await this.procesarProductos(rows, headers, user);
          break;
        case 'proveedores':
          resultado = await this.procesarProveedores(rows, headers, user);
          break;
        case 'movimientos':
          resultado = await this.procesarMovimientos(rows, headers, user);
          break;
        case 'categorias':
          resultado = await this.procesarCategorias(rows, headers, user);
          break;
        case 'etiquetas':
          resultado = await this.procesarEtiquetas(rows, headers, user);
          break;
        default:
          throw new Error(`Tipo de importación no soportado: ${tipo}`);
      }

      // Generar archivo de errores si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoErrores = await this.generarArchivoErrores(
          resultado.errores,
          file.originalname,
          user,
        );
      }

      this.logger.log(
        `Importación rápida completada - Exitosos: ${resultado.registrosExitosos}, Errores: ${resultado.registrosConError}`,
      );

      return resultado;
    } catch (error) {
      this.logger.error(`Error procesando importación rápida: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async procesarProductos(
    rows: any[][],
    headers: string[],
    user: JwtUser,
  ): Promise<ResultadoImportacionRapida> {
    const errores: any[] = [];
    let registrosExitosos = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 porque empezamos desde la fila 2 (después del header)

      try {
        // Mapear datos según headers
        const productoData = this.mapearFilaAProducto(row, headers, rowNumber);

        // Validar datos
        const validacion = this.validarProducto(productoData);
        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
          });
          continue;
        }

        // Guardar producto
        await this.prisma.producto.create({
          data: {
            ...productoData,
            empresaId: user.empresaId,
            usuarioId: user.id,
          },
        });

        registrosExitosos++;
      } catch (error) {
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: error.message,
        });
      }
    }

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      resumen: {
        tipo: 'productos',
        empresaId: user.empresaId?.toString() || '',
        usuarioId: user.id.toString(),
        fechaProcesamiento: new Date(),
      },
    };
  }

  private async procesarProveedores(
    rows: any[][],
    headers: string[],
    user: JwtUser,
  ): Promise<ResultadoImportacionRapida> {
    const errores: any[] = [];
    let registrosExitosos = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const proveedorData = this.mapearFilaAProveedor(row, headers, rowNumber);
        const validacion = this.validarProveedor(proveedorData);

        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
          });
          continue;
        }

        await this.prisma.proveedor.create({
          data: {
            ...proveedorData,
            empresaId: user.empresaId,
            usuarioId: user.id,
          },
        });

        registrosExitosos++;
      } catch (error) {
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: error.message,
        });
      }
    }

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      resumen: {
        tipo: 'proveedores',
        empresaId: user.empresaId?.toString() || '',
        usuarioId: user.id.toString(),
        fechaProcesamiento: new Date(),
      },
    };
  }

  private async procesarMovimientos(
    rows: any[][],
    headers: string[],
    user: JwtUser,
  ): Promise<ResultadoImportacionRapida> {
    const errores: any[] = [];
    let registrosExitosos = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const movimientoData = this.mapearFilaAMovimiento(row, headers, rowNumber);
        const validacion = this.validarMovimiento(movimientoData);

        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
          });
          continue;
        }

        await this.prisma.movimientoInventario.create({
          data: {
            ...movimientoData,
            empresaId: user.empresaId,
            usuarioId: user.id,
          },
        });

        registrosExitosos++;
      } catch (error) {
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: error.message,
        });
      }
    }

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      resumen: {
        tipo: 'movimientos',
        empresaId: user.empresaId?.toString() || '',
        usuarioId: user.id.toString(),
        fechaProcesamiento: new Date(),
      },
    };
  }

  private async procesarCategorias(
    rows: any[][],
    headers: string[],
    user: JwtUser,
  ): Promise<ResultadoImportacionRapida> {
    const errores: any[] = [];
    let registrosExitosos = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const categoriaData = this.mapearFilaACategoria(row, headers, rowNumber);
        const validacion = this.validarCategoria(categoriaData);

        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
          });
          continue;
        }

        // Las categorías se manejan como etiquetas en el modelo Producto
        // No se crea un registro separado, se usa el campo etiquetas
        registrosExitosos++;
      } catch (error) {
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: error.message,
        });
      }
    }

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      resumen: {
        tipo: 'categorias',
        empresaId: user.empresaId?.toString() || '',
        usuarioId: user.id.toString(),
        fechaProcesamiento: new Date(),
      },
    };
  }

  private async procesarEtiquetas(
    rows: any[][],
    headers: string[],
    user: JwtUser,
  ): Promise<ResultadoImportacionRapida> {
    const errores: any[] = [];
    let registrosExitosos = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const etiquetaData = this.mapearFilaAEtiqueta(row, headers, rowNumber);
        const validacion = this.validarEtiqueta(etiquetaData);

        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
          });
          continue;
        }

        // Las etiquetas se manejan como arrays en el modelo Producto
        // No se crea un registro separado, se usa el campo etiquetas
        registrosExitosos++;
      } catch (error) {
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: error.message,
        });
      }
    }

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      resumen: {
        tipo: 'etiquetas',
        empresaId: user.empresaId?.toString() || '',
        usuarioId: user.id.toString(),
        fechaProcesamiento: new Date(),
      },
    };
  }

  // Métodos de mapeo y validación (simplificados)
  private mapearFilaAProducto(row: any[], headers: string[], rowNumber: number) {
    const producto: any = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      switch (header.toLowerCase()) {
        case 'nombre':
          producto.nombre = value;
          break;
        case 'descripcion':
          producto.descripcion = value;
          break;
        case 'precio':
          producto.precio = parseFloat(value) || 0;
          break;
        case 'stock':
          producto.stock = parseInt(value) || 0;
          break;
        case 'categoria':
          producto.categoria = value;
          break;
        case 'proveedor':
          producto.proveedor = value;
          break;
      }
    });

    return producto;
  }

  private mapearFilaAProveedor(row: any[], headers: string[], rowNumber: number) {
    const proveedor: any = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      switch (header.toLowerCase()) {
        case 'nombre':
          proveedor.nombre = value;
          break;
        case 'email':
          proveedor.email = value;
          break;
        case 'telefono':
          proveedor.telefono = value;
          break;
        case 'direccion':
          proveedor.direccion = value;
          break;
      }
    });

    return proveedor;
  }

  private mapearFilaAMovimiento(row: any[], headers: string[], rowNumber: number) {
    const movimiento: any = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      switch (header.toLowerCase()) {
        case 'producto':
          movimiento.productoId = value;
          break;
        case 'tipo':
          movimiento.tipo = value;
          break;
        case 'cantidad':
          movimiento.cantidad = parseInt(value) || 0;
          break;
        case 'motivo':
          movimiento.motivo = value;
          break;
      }
    });

    return movimiento;
  }

  private mapearFilaACategoria(row: any[], headers: string[], rowNumber: number) {
    const categoria: any = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      switch (header.toLowerCase()) {
        case 'nombre':
          categoria.nombre = value;
          break;
        case 'descripcion':
          categoria.descripcion = value;
          break;
      }
    });

    return categoria;
  }

  private mapearFilaAEtiqueta(row: any[], headers: string[], rowNumber: number) {
    const etiqueta: any = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      switch (header.toLowerCase()) {
        case 'nombre':
          etiqueta.nombre = value;
          break;
        case 'color':
          etiqueta.color = value;
          break;
      }
    });

    return etiqueta;
  }

  // Validaciones simplificadas
  private validarProducto(data: any) {
    if (!data.nombre) {
      return { valido: false, columna: 'nombre', valor: data.nombre, mensaje: 'Nombre es requerido' };
    }
    if (data.precio < 0) {
      return { valido: false, columna: 'precio', valor: data.precio, mensaje: 'Precio debe ser positivo' };
    }
    return { valido: true };
  }

  private validarProveedor(data: any) {
    if (!data.nombre) {
      return { valido: false, columna: 'nombre', valor: data.nombre, mensaje: 'Nombre es requerido' };
    }
    if (data.email && !this.isValidEmail(data.email)) {
      return { valido: false, columna: 'email', valor: data.email, mensaje: 'Email inválido' };
    }
    return { valido: true };
  }

  private validarMovimiento(data: any) {
    if (!data.productoId) {
      return { valido: false, columna: 'producto', valor: data.productoId, mensaje: 'Producto es requerido' };
    }
    if (!data.tipo || !['entrada', 'salida'].includes(data.tipo)) {
      return { valido: false, columna: 'tipo', valor: data.tipo, mensaje: 'Tipo debe ser entrada o salida' };
    }
    if (data.cantidad <= 0) {
      return { valido: false, columna: 'cantidad', valor: data.cantidad, mensaje: 'Cantidad debe ser positiva' };
    }
    return { valido: true };
  }

  private validarCategoria(data: any) {
    if (!data.nombre) {
      return { valido: false, columna: 'nombre', valor: data.nombre, mensaje: 'Nombre es requerido' };
    }
    return { valido: true };
  }

  private validarEtiqueta(data: any) {
    if (!data.nombre) {
      return { valido: false, columna: 'nombre', valor: data.nombre, mensaje: 'Nombre es requerido' };
    }
    return { valido: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async generarArchivoErrores(
    errores: any[],
    originalFileName: string,
    user: JwtUser,
  ): Promise<string> {
    try {
      // Crear workbook con errores
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(errores);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Errores');

      // Generar nombre de archivo
      const timestamp = Date.now();
      const fileName = `errores-${originalFileName.replace(/\.[^/.]+$/, '')}-${timestamp}.xlsx`;
      const filePath = path.join(process.cwd(), 'uploads', 'reportes', fileName);

      // Asegurar que el directorio existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Escribir archivo
      XLSX.writeFile(workbook, filePath);

      this.logger.log(`Archivo de errores generado: ${filePath}`);

      return fileName;
    } catch (error) {
      this.logger.error(`Error generando archivo de errores: ${error.message}`);
      return '';
    }
  }
} 