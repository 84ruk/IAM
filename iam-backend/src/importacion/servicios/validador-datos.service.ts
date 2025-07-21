import { Injectable, Logger } from '@nestjs/common';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface ReglaValidacion {
  campo: string;
  tipo: 'requerido' | 'formato' | 'rango' | 'longitud' | 'lista' | 'email' | 'fecha' | 'unico';
  mensaje: string;
  condicion?: any;
  validar?: (valor: any, registro: any) => boolean;
}

export interface ResultadoValidacion {
  esValido: boolean;
  errores: ErrorImportacion[];
}

@Injectable()
export class ValidadorDatosService {
  private readonly logger = new Logger(ValidadorDatosService.name);

  /**
   * Valida datos de productos
   */
  validarProductos(datos: any[], empresaId: number): ResultadoValidacion {
    const errores: ErrorImportacion[] = [];
    const reglas = this.obtenerReglasProductos();

    datos.forEach((registro, index) => {
      const erroresRegistro = this.validarRegistro(registro, reglas, index + 2);
      errores.push(...erroresRegistro);
    });

    return {
      esValido: errores.length === 0,
      errores,
    };
  }

  /**
   * Valida datos de proveedores
   */
  validarProveedores(datos: any[], empresaId: number): ResultadoValidacion {
    const errores: ErrorImportacion[] = [];
    const reglas = this.obtenerReglasProveedores();

    datos.forEach((registro, index) => {
      const erroresRegistro = this.validarRegistro(registro, reglas, index + 2);
      errores.push(...erroresRegistro);
    });

    return {
      esValido: errores.length === 0,
      errores,
    };
  }

  /**
   * Valida datos de movimientos
   */
  validarMovimientos(datos: any[], empresaId: number, productosEmpresa: Map<string, any>): ResultadoValidacion {
    const errores: ErrorImportacion[] = [];
    const reglas = this.obtenerReglasMovimientos();

    datos.forEach((registro, index) => {
      const erroresRegistro = this.validarRegistro(registro, reglas, index + 2);
      
      // Validaciones específicas de movimientos
      const erroresEspecificos = this.validarMovimientoEspecifico(registro, productosEmpresa, index + 2);
      erroresRegistro.push(...erroresEspecificos);
      
      errores.push(...erroresRegistro);
    });

    return {
      esValido: errores.length === 0,
      errores,
    };
  }

  /**
   * Valida un registro individual contra las reglas especificadas
   */
  private validarRegistro(registro: any, reglas: ReglaValidacion[], fila: number): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    reglas.forEach(regla => {
      const valor = registro[regla.campo];
      const esValido = this.ejecutarValidacion(valor, registro, regla);

      if (!esValido) {
        errores.push({
          fila,
          columna: regla.campo,
          valor: valor?.toString() || '',
          mensaje: regla.mensaje,
          tipo: 'validacion',
        });
      }
    });

    return errores;
  }

  /**
   * Ejecuta una validación específica
   */
  private ejecutarValidacion(valor: any, registro: any, regla: ReglaValidacion): boolean {
    switch (regla.tipo) {
      case 'requerido':
        return this.validarRequerido(valor);
      case 'formato':
        return this.validarFormato(valor, regla.condicion);
      case 'rango':
        return this.validarRango(valor, regla.condicion);
      case 'longitud':
        return this.validarLongitud(valor, regla.condicion);
      case 'lista':
        return this.validarLista(valor, regla.condicion);
      case 'email':
        return this.validarEmail(valor);
      case 'fecha':
        return this.validarFecha(valor, regla.condicion);
      case 'unico':
        return regla.validar ? regla.validar(valor, registro) : true;
      default:
        return true;
    }
  }

  /**
   * Validaciones específicas para movimientos
   */
  private validarMovimientoEspecifico(
    registro: any, 
    productosEmpresa: Map<string, any>, 
    fila: number
  ): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    // Validar que el producto existe
    const productoNombre = registro.productoNombre?.toString().toLowerCase().trim();
    const codigoBarras = registro.codigoBarras?.toString().trim();
    
    const producto = productosEmpresa.get(productoNombre) ||
                    productosEmpresa.get(codigoBarras);

    if (!producto) {
      errores.push({
        fila,
        columna: 'productoNombre',
        valor: registro.productoNombre || '',
        mensaje: 'Producto no encontrado en la empresa',
        tipo: 'referencia',
      });
    } else {
      // Validar stock disponible para salidas
      if (registro.tipo === 'SALIDA') {
        const cantidad = parseInt(registro.cantidad);
        if (producto.stock < cantidad) {
          errores.push({
            fila,
            columna: 'cantidad',
            valor: registro.cantidad,
            mensaje: `Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${cantidad}`,
            tipo: 'validacion',
          });
        }
      }
    }

    return errores;
  }

  // Métodos de validación específicos
  private validarRequerido(valor: any): boolean {
    return valor !== null && valor !== undefined && valor !== '';
  }

  private validarFormato(valor: any, formato: string): boolean {
    if (!valor) return true; // Campos opcionales

    switch (formato) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(valor.toString());
      case 'YYYY-MM-DD':
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(valor.toString())) return false;
        const fecha = new Date(valor);
        return !isNaN(fecha.getTime());
      default:
        return true;
    }
  }

  private validarRango(valor: any, rango: any): boolean {
    if (!valor) return true; // Campos opcionales

    const numero = parseFloat(valor);
    if (isNaN(numero)) return false;

    if (rango.min !== undefined && numero < rango.min) return false;
    if (rango.max !== undefined && numero > rango.max) return false;

    return true;
  }

  private validarLongitud(valor: any, longitud: any): boolean {
    if (!valor) return true; // Campos opcionales

    const texto = valor.toString();
    
    if (longitud.min !== undefined && texto.length < longitud.min) return false;
    if (longitud.max !== undefined && texto.length > longitud.max) return false;

    return true;
  }

  private validarLista(valor: any, valoresPermitidos: string[]): boolean {
    if (!valor) return true; // Campos opcionales

    return valoresPermitidos.includes(valor.toString().toUpperCase());
  }

  private validarEmail(valor: any): boolean {
    if (!valor) return true; // Campos opcionales

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(valor.toString());
  }

  private validarFecha(valor: any, formato?: string): boolean {
    if (!valor) return true; // Campos opcionales

    const fecha = new Date(valor);
    return !isNaN(fecha.getTime());
  }

  // Reglas de validación por tipo de entidad
  private obtenerReglasProductos(): ReglaValidacion[] {
    return [
      {
        campo: 'nombre',
        tipo: 'requerido',
        mensaje: 'El nombre del producto es requerido',
      },
      {
        campo: 'nombre',
        tipo: 'longitud',
        mensaje: 'El nombre debe tener entre 2 y 100 caracteres',
        condicion: { min: 2, max: 100 },
      },
      {
        campo: 'stock',
        tipo: 'requerido',
        mensaje: 'El stock es requerido',
      },
      {
        campo: 'stock',
        tipo: 'rango',
        mensaje: 'El stock debe ser un número entre 0 y 999,999',
        condicion: { min: 0, max: 999999 },
      },
      {
        campo: 'precioCompra',
        tipo: 'requerido',
        mensaje: 'El precio de compra es requerido',
      },
      {
        campo: 'precioCompra',
        tipo: 'rango',
        mensaje: 'El precio de compra debe ser mayor a 0',
        condicion: { min: 0 },
      },
      {
        campo: 'precioVenta',
        tipo: 'requerido',
        mensaje: 'El precio de venta es requerido',
      },
      {
        campo: 'precioVenta',
        tipo: 'rango',
        mensaje: 'El precio de venta debe ser mayor a 0',
        condicion: { min: 0 },
      },
      {
        campo: 'stockMinimo',
        tipo: 'rango',
        mensaje: 'El stock mínimo debe ser un número entre 0 y 999,999',
        condicion: { min: 0, max: 999999 },
      },
      {
        campo: 'tipoProducto',
        tipo: 'lista',
        mensaje: 'El tipo de producto debe ser uno de: GENERICO, MEDICAMENTO, ALIMENTO, ROPA, ELECTRONICO',
        condicion: ['GENERICO', 'MEDICAMENTO', 'ALIMENTO', 'ROPA', 'ELECTRONICO'],
      },
      {
        campo: 'unidad',
        tipo: 'lista',
        mensaje: 'La unidad debe ser una de: UNIDAD, CAJA, KILOGRAMO, LITRO, METRO',
        condicion: ['UNIDAD', 'CAJA', 'KILOGRAMO', 'LITRO', 'METRO'],
      },
    ];
  }

  private obtenerReglasProveedores(): ReglaValidacion[] {
    return [
      {
        campo: 'nombre',
        tipo: 'requerido',
        mensaje: 'El nombre del proveedor es requerido',
      },
      {
        campo: 'nombre',
        tipo: 'longitud',
        mensaje: 'El nombre debe tener entre 2 y 100 caracteres',
        condicion: { min: 2, max: 100 },
      },
      {
        campo: 'email',
        tipo: 'email',
        mensaje: 'El email debe tener un formato válido',
      },
      {
        campo: 'email',
        tipo: 'longitud',
        mensaje: 'El email no puede exceder 100 caracteres',
        condicion: { max: 100 },
      },
      {
        campo: 'telefono',
        tipo: 'longitud',
        mensaje: 'El teléfono no puede exceder 20 caracteres',
        condicion: { max: 20 },
      },
    ];
  }

  private obtenerReglasMovimientos(): ReglaValidacion[] {
    return [
      {
        campo: 'productoNombre',
        tipo: 'requerido',
        mensaje: 'El nombre del producto es requerido',
      },
      {
        campo: 'tipo',
        tipo: 'requerido',
        mensaje: 'El tipo de movimiento es requerido',
      },
      {
        campo: 'tipo',
        tipo: 'lista',
        mensaje: 'El tipo debe ser ENTRADA o SALIDA',
        condicion: ['ENTRADA', 'SALIDA'],
      },
      {
        campo: 'cantidad',
        tipo: 'requerido',
        mensaje: 'La cantidad es requerida',
      },
      {
        campo: 'cantidad',
        tipo: 'rango',
        mensaje: 'La cantidad debe ser mayor a 0',
        condicion: { min: 1 },
      },
      {
        campo: 'fecha',
        tipo: 'requerido',
        mensaje: 'La fecha es requerida',
      },
      {
        campo: 'fecha',
        tipo: 'fecha',
        mensaje: 'La fecha debe tener un formato válido (YYYY-MM-DD)',
        condicion: 'YYYY-MM-DD',
      },
      {
        campo: 'motivo',
        tipo: 'longitud',
        mensaje: 'El motivo no puede exceder 200 caracteres',
        condicion: { max: 200 },
      },
      {
        campo: 'descripcion',
        tipo: 'longitud',
        mensaje: 'La descripción no puede exceder 500 caracteres',
        condicion: { max: 500 },
      },
    ];
  }
} 