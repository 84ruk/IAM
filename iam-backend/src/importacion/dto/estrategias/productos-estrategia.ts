import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ErrorImportacion,
  RegistroImportacion,
  ProductoImportacion 
} from '../../../colas/interfaces/trabajo-importacion.interface';
import { EstrategiaImportacion, ContextoValidacion } from './base-estrategia.interface';

@Injectable()
export class ProductosEstrategia implements EstrategiaImportacion {
  readonly tipo = 'productos';
  readonly nombre = 'Estrategia de Importación de Productos';
  
  private readonly logger = new Logger(ProductosEstrategia.name);

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
    const producto = registro as ProductoImportacion;

    // Validaciones básicas
    if (!producto.nombre || String(producto.nombre).trim() === '') {
      errores.push({
        fila: producto._filaOriginal,
        columna: 'nombre',
        valor: String(producto.nombre),
        mensaje: 'El nombre del producto es requerido',
        tipo: 'validacion',
      });
    }

    if (producto.stock !== undefined && producto.stock !== null) {
      const stock = Number(producto.stock);
      if (isNaN(stock) || stock < 0) {
        errores.push({
          fila: producto._filaOriginal,
          columna: 'stock',
          valor: String(producto.stock),
          mensaje: 'El stock debe ser un número mayor o igual a 0',
          tipo: 'validacion',
        });
      }
    }

    if (producto.precioCompra !== undefined && producto.precioCompra !== null) {
      const precioCompra = Number(producto.precioCompra);
      if (isNaN(precioCompra) || precioCompra < 0) {
        errores.push({
          fila: producto._filaOriginal,
          columna: 'precioCompra',
          valor: String(producto.precioCompra),
          mensaje: 'El precio de compra debe ser un número mayor o igual a 0',
          tipo: 'validacion',
        });
      }
    }

    if (producto.precioVenta !== undefined && producto.precioVenta !== null) {
      const precioVenta = Number(producto.precioVenta);
      if (isNaN(precioVenta) || precioVenta < 0) {
        errores.push({
          fila: producto._filaOriginal,
          columna: 'precioVenta',
          valor: String(producto.precioVenta),
          mensaje: 'El precio de venta debe ser un número mayor o igual a 0',
          tipo: 'validacion',
        });
      }
    }

    // Validaciones específicas según configuración
    if (contexto?.configuracion) {
      const config = contexto.configuracion;
      
      if (config.validarPrecios && producto.precioCompra && producto.precioVenta) {
        const precioCompra = Number(producto.precioCompra);
        const precioVenta = Number(producto.precioVenta);
        
        if (precioVenta < precioCompra) {
          errores.push({
            fila: producto._filaOriginal,
            columna: 'precioVenta',
            valor: String(producto.precioVenta),
            mensaje: 'El precio de venta no puede ser menor al precio de compra',
            tipo: 'validacion',
          });
        }
      }
    }

    return errores;
  }

  async transformarDatos(datos: RegistroImportacion[]): Promise<RegistroImportacion[]> {
    return datos.map(registro => {
      const producto = registro as ProductoImportacion;
      
      // Normalizar datos
      return {
        ...producto,
        nombre: String(producto.nombre).trim(),
        descripcion: producto.descripcion ? String(producto.descripcion).trim() : null,
        stock: producto.stock !== undefined && producto.stock !== null ? Number(producto.stock) : 0,
        precioCompra: producto.precioCompra !== undefined && producto.precioCompra !== null ? Number(producto.precioCompra) : 0,
        precioVenta: producto.precioVenta !== undefined && producto.precioVenta !== null ? Number(producto.precioVenta) : 0,
        stockMinimo: producto.stockMinimo !== undefined && producto.stockMinimo !== null ? Number(producto.stockMinimo) : 0,
        categoria: producto.categoria ? String(producto.categoria).trim() : null,
        proveedor: producto.proveedor ? String(producto.proveedor).trim() : null,
        codigoBarras: producto.codigoBarras ? String(producto.codigoBarras).trim() : null,
        sku: producto.sku ? String(producto.sku).trim() : null,
        unidadMedida: producto.unidadMedida ? String(producto.unidadMedida).trim() : null,
        ubicacion: producto.ubicacion ? String(producto.ubicacion).trim() : null,
        color: producto.color ? String(producto.color).trim() : null,
        talla: producto.talla ? String(producto.talla).trim() : null,
        tipoProducto: producto.tipoProducto ? String(producto.tipoProducto).trim() : null,
        humedadOptima: producto.humedadOptima !== undefined && producto.humedadOptima !== null ? Number(producto.humedadOptima) : null,
        temperaturaOptima: producto.temperaturaOptima !== undefined && producto.temperaturaOptima !== null ? Number(producto.temperaturaOptima) : null,
        rfid: producto.rfid ? String(producto.rfid).trim() : null,
      };
    });
  }

  async verificarExistencia(registro: RegistroImportacion, empresaId: number): Promise<any> {
    const producto = registro as ProductoImportacion;
    
    // Buscar por nombre (normalizado)
    const nombreNormalizado = String(producto.nombre).toLowerCase().trim();
    
    const existente = await this.prisma.producto.findFirst({
      where: {
        empresaId,
        OR: [
          { nombre: { equals: nombreNormalizado, mode: 'insensitive' } },
          { codigoBarras: producto.codigoBarras ? String(producto.codigoBarras) : undefined },
        ],
      },
    });

    return existente;
  }

  async guardarRegistro(registro: RegistroImportacion, trabajo: TrabajoImportacion, existente: any): Promise<void> {
    const producto = registro as ProductoImportacion;
    
    // Procesar etiquetas si existe categoría
    const etiquetas = producto.categoria ? [String(producto.categoria).trim()] : [];
    
    // Procesar tipo de producto
    let tipoProducto = 'GENERICO' as any;
    if (producto.tipoProducto) {
      const tipo = String(producto.tipoProducto).toUpperCase();
      if (['GENERICO', 'MEDICAMENTO', 'ALIMENTO', 'ROPA', 'ELECTRONICO'].includes(tipo)) {
        tipoProducto = tipo;
      }
    }
    
    // Procesar unidad de medida
    let unidad = 'UNIDAD' as any;
    if (producto.unidadMedida) {
      const unidadStr = String(producto.unidadMedida).toUpperCase();
      if (['UNIDAD', 'KILO', 'KILOGRAMO', 'LITRO', 'LITROS', 'CAJA', 'PAQUETE', 'METRO', 'METROS', 'GRAMO', 'GRAMOS', 'MILILITRO', 'MILILITROS', 'CENTIMETRO', 'CENTIMETROS'].includes(unidadStr)) {
        unidad = unidadStr;
      }
    }

    const datosProducto = {
      nombre: String(producto.nombre).trim(),
      descripcion: producto.descripcion ? String(producto.descripcion).trim() : null,
      stock: Number(producto.stock) || 0,
      precioCompra: Number(producto.precioCompra) || 0,
      precioVenta: Number(producto.precioVenta) || 0,
      stockMinimo: Number(producto.stockMinimo) || 0,
      etiquetas: etiquetas,
      codigoBarras: producto.codigoBarras ? String(producto.codigoBarras).trim() : null,
      sku: producto.sku ? String(producto.sku).trim() : null,
      ubicacion: producto.ubicacion ? String(producto.ubicacion).trim() : null,
      color: producto.color ? String(producto.color).trim() : null,
      talla: producto.talla ? String(producto.talla).trim() : null,
      tipoProducto: tipoProducto,
      unidad: unidad,
      humedadOptima: producto.humedadOptima !== undefined && producto.humedadOptima !== null ? Number(producto.humedadOptima) : null,
      temperaturaOptima: producto.temperaturaOptima !== undefined && producto.temperaturaOptima !== null ? Number(producto.temperaturaOptima) : null,
      rfid: producto.rfid ? String(producto.rfid).trim() : null,
      empresaId: trabajo.empresaId,
    };

    if (existente && trabajo.opciones.sobrescribirExistentes) {
      await this.prisma.producto.update({
        where: { id: existente.id },
        data: datosProducto,
      });
    } else if (!existente) {
      await this.prisma.producto.create({
        data: datosProducto,
      });
    }
  }

  obtenerConfiguracionProcesamiento() {
    return {
      loteSize: 100,
      maxRetries: 3,
      timeout: 30000,
      enableCache: true,
      cacheTTL: 1800,
    };
  }

  obtenerColumnasRequeridas(): string[] {
    return ['nombre', 'stock', 'precioCompra', 'precioVenta', 'stockMinimo'];
  }

  obtenerColumnasOpcionales(): string[] {
    return ['descripcion', 'categoria', 'proveedor', 'codigoBarras', 'sku', 'unidadMedida', 'ubicacion', 'color', 'talla', 'tipoProducto', 'humedadOptima', 'temperaturaOptima', 'rfid'];
  }

  obtenerValidacionesEspecificas(): any[] {
    return [
      { campo: 'nombre', tipo: 'requerido', mensaje: 'El nombre del producto es requerido' },
      { campo: 'stock', tipo: 'rango', condicion: { min: 0 }, mensaje: 'El stock debe ser mayor o igual a 0' },
      { campo: 'precioCompra', tipo: 'rango', condicion: { min: 0 }, mensaje: 'El precio de compra debe ser mayor o igual a 0' },
      { campo: 'precioVenta', tipo: 'rango', condicion: { min: 0 }, mensaje: 'El precio de venta debe ser mayor o igual a 0' },
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

          // Verificar existencia
          const existente = await this.verificarExistencia(registro, trabajo.empresaId);
          if (existente && !trabajo.opciones.sobrescribirExistentes) {
            resultado.errores.push({
              fila: registro._filaOriginal,
              columna: 'nombre',
              valor: String((registro as ProductoImportacion).nombre),
              mensaje: 'Producto ya existe y no se permite sobrescribir',
              tipo: 'duplicado',
            });
            resultado.estadisticas.duplicados++;
            break;
          }

          // Guardar registro
          await this.guardarRegistro(registro, trabajo, existente);
          
          resultado.estadisticas.exitosos++;
          success = true;

        } catch (error) {
          retryCount++;
          this.logger.warn(`Error procesando producto (intento ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            // Manejar errores específicos de Prisma
            let mensajeError = `Error del sistema: ${error.message}`;
            let columnaError = 'sistema';
            let tipoError = 'sistema';

            // Detectar errores de restricción única
            if (error.code === 'P2002') {
              const campos = error.meta?.target || [];
              if (campos.includes('codigoBarras')) {
                mensajeError = 'El código de barras ya existe en la base de datos';
                columnaError = 'codigoBarras';
                tipoError = 'duplicado';
              } else if (campos.includes('sku')) {
                mensajeError = 'El SKU ya existe en la base de datos';
                columnaError = 'sku';
                tipoError = 'duplicado';
              } else if (campos.includes('nombre')) {
                mensajeError = 'El nombre del producto ya existe en la base de datos';
                columnaError = 'nombre';
                tipoError = 'duplicado';
              } else {
                mensajeError = `El producto ya existe (campos únicos: ${campos.join(', ')})`;
                columnaError = campos[0] || 'sistema';
                tipoError = 'duplicado';
              }
            }
            // Detectar errores de validación de Prisma
            else if (error.code === 'P2003') {
              mensajeError = 'Error de referencia: verificar datos relacionados';
              tipoError = 'referencia';
            }
            // Detectar errores de datos requeridos
            else if (error.code === 'P2011') {
              mensajeError = 'Campo requerido está vacío';
              tipoError = 'validacion';
            }

            resultado.errores.push({
              fila: registro._filaOriginal,
              columna: columnaError,
              valor: String((registro as ProductoImportacion)[columnaError] || ''),
              mensaje: mensajeError,
              tipo: tipoError as 'validacion' | 'duplicado' | 'referencia' | 'sistema',
            });
            resultado.estadisticas.errores++;
          }
        }
      }
    }
  }

  private obtenerSugerenciaError(error: any, registro: RegistroImportacion): string {
    if (error.code === 'P2002') {
      const campos = error.meta?.target || [];
      if (campos.includes('codigoBarras')) {
        return 'Sugerencia: Cambiar el código de barras o habilitar "Sobrescribir existentes"';
      } else if (campos.includes('sku')) {
        return 'Sugerencia: Cambiar el SKU o habilitar "Sobrescribir existentes"';
      } else if (campos.includes('nombre')) {
        return 'Sugerencia: Cambiar el nombre del producto o habilitar "Sobrescribir existentes"';
      }
      return 'Sugerencia: Verificar campos únicos o habilitar "Sobrescribir existentes"';
    }
    return 'Sugerencia: Verificar los datos del registro';
  }
} 