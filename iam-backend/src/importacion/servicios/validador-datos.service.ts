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
   * Obtiene variaciones comunes para un campo específico (enfoque en español)
   */
  private obtenerVariacionesCampo(campo: string): string[] {
    const variaciones: Record<string, string[]> = {
      'nombre': [
        'name', 'producto', 'product', 'producto_nombre', 'nombre_producto', 'product_name', 'productname',
        'descripcion', 'description', 'desc', 'detalle', 'detail', 'descripcion_producto', 'producto_descripcion'
      ],
      'stock': [
        'cantidad', 'quantity', 'qty', 'inventario', 'inventory', 'existencia', 'existencias',
        'stock_actual', 'stock_disponible', 'cantidad_disponible', 'cantidad_stock'
      ],
      'precioCompra': [
        'preciocompra', 'precio_compra', 'precio compra', 'preciocompra_producto', 'precio_compra_producto',
        'precio_compra_unidad', 'precio_compra_unitario', 'costo', 'costo_producto', 'costo_unidad', 'costo_unitario',
        'precio_costo', 'costo_compra', 'purchase_price', 'purchaseprice', 'cost', 'cost_price', 'costprice'
      ],
      'precioVenta': [
        'precioventa', 'precio_venta', 'precio venta', 'precioventa_producto', 'precio_venta_producto',
        'precio_venta_unidad', 'precio_venta_unitario', 'precio', 'precio_producto', 'precio_unidad', 'precio_unitario',
        'precio_publico', 'precio_final', 'sale_price', 'saleprice', 'price', 'selling_price', 'sellingprice'
      ],
      'stockMinimo': [
        'stockminimo', 'stock_minimo', 'stock minimo', 'stock_min', 'stockmin', 'stock_minimo_requerido',
        'stock_minimo_disponible', 'cantidad_minima', 'cantidad_min', 'cantidadminima', 'cantidadmin',
        'min_stock', 'minstock', 'minimum_stock', 'minimumstock'
      ],
      'tipoProducto': [
        'tipoproducto', 'tipo_producto', 'tipo producto', 'tipo', 'categoria', 'categoria_producto',
        'producto_tipo', 'producto_categoria', 'clasificacion', 'clasificacion_producto',
        'product_type', 'producttype', 'type', 'category'
      ],
      'unidad': [
        'unidad', 'unidad_medida', 'unidadmedida', 'medida', 'medida_unidad',
        'unit', 'measure', 'measurement', 'uom'
      ],
      'estado': [
        'estado', 'estado_producto', 'producto_estado', 'activo', 'activo_inactivo',
        'status', 'active'
      ],
      'codigoBarras': [
        'codigobarras', 'codigo_barras', 'codigo barras', 'codigo_barras_producto',
        'barras', 'codigo_barras_unico', 'barcode', 'bar_code', 'barcodes'
      ],
      'sku': [
        'sku', 'codigo', 'codigo_producto', 'codigo_interno', 'codigo_unico', 'codigo_identificacion',
        'identificador', 'identificador_producto', 'code', 'product_code', 'productcode', 'item_code', 'itemcode'
      ],
      'etiquetas': [
        'etiquetas', 'etiqueta', 'etiquetas_producto', 'tags', 'tag', 'labels', 'label'
      ],
      'marca': [
        'marca', 'marca_producto', 'producto_marca', 'fabricante', 'fabricante_producto',
        'brand', 'manufacturer'
      ],
      'modelo': [
        'modelo', 'modelo_producto', 'producto_modelo', 'version', 'version_producto', 'model'
      ],
      'especificaciones': [
        'especificaciones', 'especificacion', 'especificaciones_producto', 'producto_especificaciones',
        'detalles_tecnicos', 'caracteristicas', 'caracteristicas_producto',
        'specifications', 'specs', 'spec', 'detalles', 'details'
      ],
      'ubicacion': [
        'ubicacion', 'ubicacion_producto', 'producto_ubicacion', 'lugar', 'lugar_almacenamiento',
        'posicion', 'posicion_almacen', 'location', 'place', 'position'
      ],
      'temperatura': [
        'temperatura', 'temperatura_almacenamiento', 'temperatura_requerida', 'temp', 'temperature'
      ],
      'humedad': [
        'humedad', 'humedad_almacenamiento', 'humedad_requerida', 'hum', 'humidity'
      ]
    };

    return variaciones[campo] || [];
  }

  /**
   * Valida un registro individual contra las reglas especificadas
   */
  private validarRegistro(registro: any, reglas: ReglaValidacion[], fila: number): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    reglas.forEach(regla => {
      // Buscar el campo en diferentes variaciones de nombre
      let valor = registro[regla.campo];
      
      // Si no se encuentra, buscar variaciones normalizadas y mapeadas
      if (valor === undefined || valor === null) {
        const variaciones = [
          regla.campo,
          regla.campo.toLowerCase(),
          regla.campo.replace(/[^a-z0-9]/g, '_'),
          regla.campo.replace(/[^a-z0-9]/g, '').toLowerCase(),
          // Variaciones comunes para cada campo
          ...this.obtenerVariacionesCampo(regla.campo)
        ];
        
        for (const variacion of variaciones) {
          if (registro[variacion] !== undefined && registro[variacion] !== null) {
            valor = registro[variacion];
            this.logger.debug(`🔍 Campo encontrado usando variación: ${regla.campo} -> ${variacion}`);
            break;
          }
        }
      }
      
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
    if (isNaN(fecha.getTime())) return false;

    // Evitar fechas futuras (más de 1 día en el futuro)
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    
    return fecha <= mañana;
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
        mensaje: 'El tipo de producto debe ser uno de: GENERICO, MEDICAMENTO, ALIMENTO, ROPA, ELECTRONICO, SOFTWARE, HARDWARE, SUPLEMENTO, EQUIPO_MEDICO, CUIDADO_PERSONAL, BIOLOGICO, MATERIAL_QUIRURGICO',
        condicion: ['GENERICO', 'MEDICAMENTO', 'ALIMENTO', 'ROPA', 'ELECTRONICO', 'SOFTWARE', 'HARDWARE', 'SUPLEMENTO', 'EQUIPO_MEDICO', 'CUIDADO_PERSONAL', 'BIOLOGICO', 'MATERIAL_QUIRURGICO'],
      },
      {
        campo: 'unidad',
        tipo: 'lista',
        mensaje: 'La unidad debe ser una de: UNIDAD, KILO, KILOGRAMO, LITRO, LITROS, CAJA, PAQUETE, METRO, METROS, GRAMO, GRAMOS, MILILITRO, MILILITROS, CENTIMETRO, CENTIMETROS, LICENCIA',
        condicion: ['UNIDAD', 'KILO', 'KILOGRAMO', 'LITRO', 'LITROS', 'CAJA', 'PAQUETE', 'METRO', 'METROS', 'GRAMO', 'GRAMOS', 'MILILITRO', 'MILILITROS', 'CENTIMETRO', 'CENTIMETROS', 'LICENCIA'],
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
        mensaje: 'La fecha debe tener un formato válido (YYYY-MM-DD) y no puede ser futura',
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