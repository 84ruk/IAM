import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ErrorImportacion,
  RegistroImportacion,
  MovimientoImportacion 
} from '../../../colas/interfaces/trabajo-importacion.interface';
import { EstrategiaImportacion, ContextoValidacion } from './base-estrategia.interface';

@Injectable()
export class MovimientosEstrategia implements EstrategiaImportacion {
  readonly tipo = 'movimientos';
  readonly nombre = 'Estrategia de Importación de Movimientos';
  
  private readonly logger = new Logger(MovimientosEstrategia.name);

  constructor(private readonly prisma: PrismaService) {}

  validarEstructuraArchivo(datos: RegistroImportacion[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const columnasRequeridas = this.obtenerColumnasRequeridas();

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

  validarRegistro(registro: RegistroImportacion, contexto?: ContextoValidacion): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const movimiento = registro as MovimientoImportacion;

    // Validaciones básicas
    if ((!movimiento.producto && !movimiento.productoNombre) || 
        (String(movimiento.producto || movimiento.productoNombre).trim() === '')) {
      errores.push({
        fila: movimiento._filaOriginal,
        columna: 'productoNombre',
        valor: String(movimiento.producto || movimiento.productoNombre),
        mensaje: 'El nombre del producto es requerido',
        tipo: 'validacion',
      });
    }

    if (!movimiento.tipo || !['entrada', 'salida'].includes(String(movimiento.tipo).toLowerCase())) {
      errores.push({
        fila: movimiento._filaOriginal,
        columna: 'tipo',
        valor: String(movimiento.tipo),
        mensaje: 'El tipo debe ser: entrada o salida',
        tipo: 'validacion',
      });
    }

    if (movimiento.cantidad === undefined || movimiento.cantidad === null) {
      errores.push({
        fila: movimiento._filaOriginal,
        columna: 'cantidad',
        valor: String(movimiento.cantidad),
        mensaje: 'La cantidad es requerida',
        tipo: 'validacion',
      });
    } else {
      const cantidad = Number(movimiento.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        errores.push({
          fila: movimiento._filaOriginal,
          columna: 'cantidad',
          valor: String(movimiento.cantidad),
          mensaje: 'La cantidad debe ser un número mayor a 0',
          tipo: 'validacion',
        });
      }
    }

    // Validación de fecha
    if (movimiento.fecha) {
      const fecha = new Date(String(movimiento.fecha));
      if (isNaN(fecha.getTime())) {
        errores.push({
          fila: movimiento._filaOriginal,
          columna: 'fecha',
          valor: String(movimiento.fecha),
          mensaje: 'El formato de fecha no es válido',
          tipo: 'validacion',
        });
      }
    }

    // Validaciones específicas según configuración
    if (contexto?.configuracion) {
      const config = contexto.configuracion;
      
      if (config.validarFechas && movimiento.fecha) {
        const fecha = new Date(String(movimiento.fecha));
        
        if (config.fechaMinima && typeof config.fechaMinima === 'string') {
          const fechaMinima = new Date(config.fechaMinima);
          if (fecha < fechaMinima) {
            errores.push({
              fila: movimiento._filaOriginal,
              columna: 'fecha',
              valor: String(movimiento.fecha),
              mensaje: `La fecha no puede ser anterior a ${config.fechaMinima}`,
              tipo: 'validacion',
            });
          }
        }
        
        if (config.fechaMaxima && typeof config.fechaMaxima === 'string') {
          const fechaMaxima = new Date(config.fechaMaxima);
          if (fecha > fechaMaxima) {
            errores.push({
              fila: movimiento._filaOriginal,
              columna: 'fecha',
              valor: String(movimiento.fecha),
              mensaje: `La fecha no puede ser posterior a ${config.fechaMaxima}`,
              tipo: 'validacion',
            });
          }
        }
      }
    }

    // Validación de producto existente
    if (contexto?.productosEmpresa && (movimiento.producto || movimiento.productoNombre)) {
      const nombreProducto = String(movimiento.producto || movimiento.productoNombre).toLowerCase().trim();
      const productoExiste = contexto.productosEmpresa.has(nombreProducto);
      
      if (!productoExiste && !contexto?.configuracion?.crearProductoSiNoExiste) {
        errores.push({
          fila: movimiento._filaOriginal,
          columna: 'productoNombre',
          valor: String(movimiento.producto || movimiento.productoNombre),
          mensaje: 'El producto no existe en el inventario',
          tipo: 'referencia',
        });
      }
    }

    return errores;
  }

  async transformarDatos(datos: RegistroImportacion[]): Promise<RegistroImportacion[]> {
    return datos.map(registro => {
      const movimiento = registro as MovimientoImportacion;
      
      // Normalizar datos
      return {
        ...movimiento,
        fecha: movimiento.fecha ? new Date(String(movimiento.fecha)) : new Date(),
        tipo: String(movimiento.tipo).toLowerCase() as 'entrada' | 'salida',
        producto: String(movimiento.producto || movimiento.productoNombre).trim(),
        productoNombre: String(movimiento.productoNombre || movimiento.producto).trim(),
        cantidad: Number(movimiento.cantidad) || 0,
        motivo: movimiento.motivo ? String(movimiento.motivo).trim() : 'Importación masiva',
        descripcion: movimiento.descripcion ? String(movimiento.descripcion).trim() : null,
      };
    });
  }

  async verificarExistencia(registro: RegistroImportacion, empresaId: number): Promise<any> {
    const movimiento = registro as MovimientoImportacion;
    
    // Para movimientos, verificamos si el producto existe
    // Puede venir como 'producto' o 'productoNombre'
    const nombreProducto = String(movimiento.producto || movimiento.productoNombre).toLowerCase().trim();
    
    const producto = await this.prisma.producto.findFirst({
      where: {
        empresaId,
        nombre: { equals: nombreProducto, mode: 'insensitive' },
      },
    });

    return producto;
  }

  async guardarRegistro(registro: RegistroImportacion, trabajo: TrabajoImportacion, producto: any): Promise<void> {
    const movimiento = registro as MovimientoImportacion;
    
    // Si no existe el producto y está configurado para crearlo
    let productoId = producto?.id;
    
    if (!producto && trabajo.opciones.configuracionEspecifica?.crearProductoSiNoExiste) {
      const nuevoProducto = await this.prisma.producto.create({
        data: {
          nombre: String(movimiento.producto || movimiento.productoNombre).trim(),
          descripcion: `Producto creado automáticamente desde importación`,
          stock: 0,
          precioCompra: 0,
          precioVenta: 0,
          stockMinimo: 0,
          empresaId: trabajo.empresaId,
        },
      });
      productoId = nuevoProducto.id;
    }

    if (productoId) {
      // Crear el movimiento
      const datosMovimiento = {
        fecha: new Date(String(movimiento.fecha)) || new Date(),
        tipo: String(movimiento.tipo).toUpperCase() as 'ENTRADA' | 'SALIDA',
        cantidad: Number(movimiento.cantidad),
        motivo: movimiento.motivo ? String(movimiento.motivo).trim() : 'Importación masiva',
        descripcion: movimiento.descripcion ? String(movimiento.descripcion).trim() : null,
        productoId: productoId,
        empresaId: trabajo.empresaId,
      };

      await this.prisma.movimientoInventario.create({
        data: datosMovimiento,
      });

      // Actualizar stock del producto si está configurado
      if (trabajo.opciones.configuracionEspecifica?.actualizarStockEnTiempoReal) {
        const cantidad = Number(movimiento.cantidad);
        const tipo = String(movimiento.tipo).toLowerCase();
        
        let cambioStock = 0;
        if (tipo === 'entrada') {
          cambioStock = cantidad;
        } else if (tipo === 'salida') {
          cambioStock = -cantidad;
        }

        await this.prisma.producto.update({
          where: { id: productoId },
          data: {
            stock: {
              increment: cambioStock,
            },
          },
        });
      }
    }
  }

  obtenerConfiguracionProcesamiento() {
    return {
      loteSize: 50,
      maxRetries: 3,
      timeout: 30000,
      enableCache: true,
      cacheTTL: 1800,
    };
  }

  obtenerColumnasRequeridas(): string[] {
    return ['fecha', 'tipo', 'productoNombre', 'cantidad'];
  }

  obtenerColumnasOpcionales(): string[] {
    return ['motivo', 'descripcion'];
  }

  obtenerValidacionesEspecificas(): any[] {
    return [
      { campo: 'productoNombre', tipo: 'requerido', mensaje: 'El nombre del producto es requerido' },
      { campo: 'tipo', tipo: 'lista', condicion: ['entrada', 'salida'], mensaje: 'El tipo debe ser: entrada o salida' },
      { campo: 'cantidad', tipo: 'rango', condicion: { min: 0.01 }, mensaje: 'La cantidad debe ser mayor a 0' },
      { campo: 'fecha', tipo: 'fecha', mensaje: 'El formato de fecha no es válido' },
    ];
  }

  async procesarLote(
    lote: RegistroImportacion[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job,
    contexto?: ContextoValidacion
  ): Promise<void> {
    const maxRetries = this.obtenerConfiguracionProcesamiento().maxRetries;

    for (const registro of lote) {
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          // Validar registro
          const erroresValidacion = this.validarRegistro(registro, contexto);
          if (erroresValidacion.length > 0) {
            resultado.errores.push(...erroresValidacion);
            resultado.estadisticas.errores++;
            break;
          }

          // Verificar existencia del producto
          const producto = await this.verificarExistencia(registro, trabajo.empresaId);
          if (!producto && !trabajo.opciones.configuracionEspecifica?.crearProductoSiNoExiste) {
            resultado.errores.push({
              fila: registro._filaOriginal,
              columna: 'productoNombre',
              valor: String((registro as MovimientoImportacion).producto || (registro as MovimientoImportacion).productoNombre),
              mensaje: 'El producto no existe y no se permite crear automáticamente',
              tipo: 'referencia',
            });
            resultado.estadisticas.errores++;
            break;
          }

          // Guardar registro
          await this.guardarRegistro(registro, trabajo, producto);
          
          resultado.estadisticas.exitosos++;
          success = true;

        } catch (error) {
          retryCount++;
          this.logger.warn(`Error procesando movimiento (intento ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            resultado.errores.push({
              fila: registro._filaOriginal,
              columna: 'sistema',
              valor: '',
              mensaje: `Error del sistema: ${error.message}`,
              tipo: 'sistema',
            });
            resultado.estadisticas.errores++;
          }
        }
      }
    }
  }
} 