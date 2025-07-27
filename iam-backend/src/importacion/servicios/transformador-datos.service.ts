import { Injectable, Logger } from '@nestjs/common';

export interface MapeoColumna {
  columnaExcel: string;
  campoModelo: string;
  transformador?: (valor: any) => any;
  valorPorDefecto?: any;
}

export interface ConfiguracionTransformacion {
  mapeos: MapeoColumna[];
  transformacionesGlobales?: (registro: any) => any;
  validacionesPostTransformacion?: (registro: any) => string[];
}

@Injectable()
export class TransformadorDatosService {
  private readonly logger = new Logger(TransformadorDatosService.name);

  /**
   * Transforma datos de productos desde Excel al modelo de base de datos
   */
  transformarProductos(datos: any[]): any[] {
    const configuracion: ConfiguracionTransformacion = {
      mapeos: [
        {
          columnaExcel: 'nombre',
          campoModelo: 'nombre',
          transformador: (valor) => valor?.toString().trim(),
        },
        {
          columnaExcel: 'descripcion',
          campoModelo: 'descripcion',
          transformador: (valor) => valor?.toString().trim() || null,
        },
        {
          columnaExcel: 'stock',
          campoModelo: 'stock',
          transformador: (valor) => parseInt(valor) || 0,
        },
        {
          columnaExcel: 'precioCompra',
          campoModelo: 'precioCompra',
          transformador: (valor) => parseFloat(valor) || 0,
        },
        {
          columnaExcel: 'precioVenta',
          campoModelo: 'precioVenta',
          transformador: (valor) => parseFloat(valor) || 0,
        },
        {
          columnaExcel: 'stockMinimo',
          campoModelo: 'stockMinimo',
          transformador: (valor) => parseInt(valor) || 10,
          valorPorDefecto: 10,
        },
        {
          columnaExcel: 'tipoProducto',
          campoModelo: 'tipoProducto',
          transformador: (valor) => valor?.toString().toUpperCase() || 'GENERICO',
          valorPorDefecto: 'GENERICO',
        },
        {
          columnaExcel: 'unidad',
          campoModelo: 'unidad',
          transformador: (valor) => valor?.toString().toUpperCase() || 'UNIDAD',
          valorPorDefecto: 'UNIDAD',
        },
        {
          columnaExcel: 'etiquetas',
          campoModelo: 'etiquetas',
          transformador: (valor) => {
            if (!valor) return [];
            return valor.toString()
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag.length > 0);
          },
          valorPorDefecto: [],
        },
        {
          columnaExcel: 'codigoBarras',
          campoModelo: 'codigoBarras',
          transformador: (valor) => valor?.toString().trim() || null,
        },
        {
          columnaExcel: 'sku',
          campoModelo: 'sku',
          transformador: (valor) => valor?.toString().trim() || null,
        },
        {
          columnaExcel: 'color',
          campoModelo: 'color',
          transformador: (valor) => valor?.toString().trim() || null,
        },
        {
          columnaExcel: 'talla',
          campoModelo: 'talla',
          transformador: (valor) => valor?.toString().trim() || null,
        },
        {
          columnaExcel: 'ubicacion',
          campoModelo: 'ubicacion',
          transformador: (valor) => valor?.toString().trim() || null,
        },
      ],
      transformacionesGlobales: (registro) => {
        // Asegurar que los campos requeridos tengan valores por defecto
        if (!registro.nombre) {
          throw new Error('El nombre del producto es requerido');
        }

        // Validar que el precio de venta sea mayor al de compra
        if (registro.precioVenta <= registro.precioCompra) {
          this.logger.warn(`Producto ${registro.nombre}: El precio de venta debería ser mayor al de compra`);
        }

        // Generar SKU automático si no se proporciona
        if (!registro.sku) {
          registro.sku = this.generarSKUAutomatico(registro.nombre);
        }

        return registro;
      },
    };

    return this.transformarDatos(datos, configuracion);
  }

  /**
   * Transforma datos de proveedores desde Excel al modelo de base de datos
   */
  transformarProveedores(datos: any[]): any[] {
    const configuracion: ConfiguracionTransformacion = {
      mapeos: [
        {
          columnaExcel: 'nombre',
          campoModelo: 'nombre',
          transformador: (valor) => valor?.toString().trim(),
        },
        {
          columnaExcel: 'email',
          campoModelo: 'email',
          transformador: (valor) => valor?.toString().trim().toLowerCase() || null,
        },
        {
          columnaExcel: 'telefono',
          campoModelo: 'telefono',
          transformador: (valor) => valor?.toString().trim() || null,
        },
      ],
      transformacionesGlobales: (registro) => {
        // Validar que el nombre sea requerido
        if (!registro.nombre) {
          throw new Error('El nombre del proveedor es requerido');
        }

        // Normalizar teléfono si se proporciona
        if (registro.telefono) {
          registro.telefono = this.normalizarTelefono(registro.telefono);
        }

        return registro;
      },
    };

    return this.transformarDatos(datos, configuracion);
  }

  /**
   * Transforma datos de movimientos desde Excel al modelo de base de datos
   */
  transformarMovimientos(datos: any[]): any[] {
    const configuracion: ConfiguracionTransformacion = {
      mapeos: [
        {
          columnaExcel: 'productoId',
          campoModelo: 'productoId',
          transformador: (valor) => parseInt(valor) || null,
        },
        {
          columnaExcel: 'codigoBarras',
          campoModelo: 'codigoBarras',
          transformador: (valor) => valor?.toString().trim() || null,
        },
        {
          columnaExcel: 'tipo',
          campoModelo: 'tipo',
          transformador: (valor) => valor?.toString().toUpperCase() || 'ENTRADA',
        },
        {
          columnaExcel: 'cantidad',
          campoModelo: 'cantidad',
          transformador: (valor) => parseInt(valor) || 0,
        },
        {
          columnaExcel: 'fecha',
          campoModelo: 'fecha',
          transformador: (valor) => {
            if (!valor) return new Date();
            const fecha = new Date(valor);
            if (isNaN(fecha.getTime())) return new Date();
            
            // Evitar fechas futuras (más de 1 día en el futuro)
            const hoy = new Date();
            const mañana = new Date(hoy);
            mañana.setDate(hoy.getDate() + 1);
            
            return fecha > mañana ? new Date() : fecha;
          },
        },
        {
          columnaExcel: 'motivo',
          campoModelo: 'motivo',
          transformador: (valor) => valor?.toString().trim() || 'Importación masiva',
          valorPorDefecto: 'Importación masiva',
        },
        {
          columnaExcel: 'descripcion',
          campoModelo: 'descripcion',
          transformador: (valor) => valor?.toString().trim() || null,
        },
      ],
      transformacionesGlobales: (registro) => {
        // Validar campos requeridos
        if (!registro.productoId) {
          throw new Error('El ID del producto es requerido');
        }

        if (!registro.cantidad || registro.cantidad <= 0) {
          throw new Error('La cantidad debe ser mayor a 0');
        }

        // Validar tipo de movimiento
        if (!['ENTRADA', 'SALIDA'].includes(registro.tipo)) {
          registro.tipo = 'ENTRADA'; // Valor por defecto
        }

        return registro;
      },
    };

    return this.transformarDatos(datos, configuracion);
  }

  /**
   * Transforma datos usando la configuración especificada
   */
  private transformarDatos(datos: any[], configuracion: ConfiguracionTransformacion): any[] {
    return datos.map((registro, index) => {
      try {
        const registroTransformado: any = {};

        // Aplicar mapeos de columnas
        configuracion.mapeos.forEach(mapeo => {
          const valorOriginal = registro[mapeo.columnaExcel];
          let valorTransformado;

          if (valorOriginal !== undefined && valorOriginal !== null && valorOriginal !== '') {
            // Aplicar transformador personalizado
            if (mapeo.transformador) {
              valorTransformado = mapeo.transformador(valorOriginal);
            } else {
              valorTransformado = valorOriginal;
            }
          } else {
            // Usar valor por defecto si está definido
            valorTransformado = mapeo.valorPorDefecto;
          }

          registroTransformado[mapeo.campoModelo] = valorTransformado;
        });

        // Aplicar transformaciones globales
        if (configuracion.transformacionesGlobales) {
          const resultado = configuracion.transformacionesGlobales(registroTransformado);
          if (resultado) {
            Object.assign(registroTransformado, resultado);
          }
        }

        // Mantener información de la fila original para errores
        registroTransformado._filaOriginal = registro._filaOriginal || (index + 2);

        return registroTransformado;

      } catch (error) {
        this.logger.error(`Error transformando registro ${index + 2}:`, error);
        throw new Error(`Error en fila ${index + 2}: ${error.message}`);
      }
    });
  }

  /**
   * Genera un SKU automático basado en el nombre del producto
   */
  private generarSKUAutomatico(nombre: string): string {
    const palabras = nombre
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ' ')
      .split(' ')
      .filter(palabra => palabra.length > 0);

    if (palabras.length === 0) {
      return `PROD-${Date.now()}`;
    }

    const prefijo = palabras[0].substring(0, 4);
    const sufijo = palabras[palabras.length - 1].substring(0, 3);
    const timestamp = Date.now().toString().slice(-4);

    return `${prefijo}-${sufijo}-${timestamp}`;
  }

  /**
   * Normaliza un número de teléfono
   */
  private normalizarTelefono(telefono: string): string {
    // Remover caracteres no numéricos excepto +, -, (, )
    let normalizado = telefono.replace(/[^\d+\-\(\)]/g, '');

    // Si empieza con +52 (México), mantener el formato
    if (normalizado.startsWith('+52')) {
      return normalizado;
    }

    // Si empieza con 52, agregar +
    if (normalizado.startsWith('52')) {
      normalizado = '+' + normalizado;
    }

    // Si tiene 10 dígitos y no empieza con +, agregar +52
    if (normalizado.length === 10 && !normalizado.startsWith('+')) {
      normalizado = '+52' + normalizado;
    }

    return normalizado;
  }

  /**
   * Valida que los datos transformados sean consistentes
   */
  validarConsistencia(datos: any[], tipo: 'productos' | 'proveedores' | 'movimientos'): string[] {
    const errores: string[] = [];

    switch (tipo) {
      case 'productos':
        datos.forEach((producto, index) => {
          if (producto.precioVenta <= producto.precioCompra) {
            errores.push(`Fila ${index + 2}: El precio de venta debe ser mayor al de compra`);
          }
          if (producto.stock < 0) {
            errores.push(`Fila ${index + 2}: El stock no puede ser negativo`);
          }
        });
        break;

      case 'proveedores':
        datos.forEach((proveedor, index) => {
          if (proveedor.email && !this.validarEmail(proveedor.email)) {
            errores.push(`Fila ${index + 2}: Email inválido`);
          }
        });
        break;

      case 'movimientos':
        datos.forEach((movimiento, index) => {
          if (movimiento.cantidad <= 0) {
            errores.push(`Fila ${index + 2}: La cantidad debe ser mayor a 0`);
          }
          if (!['ENTRADA', 'SALIDA'].includes(movimiento.tipo)) {
            errores.push(`Fila ${index + 2}: Tipo de movimiento inválido`);
          }
          
          // Validar fecha no futura
          const fecha = new Date(movimiento.fecha);
          const hoy = new Date();
          const mañana = new Date(hoy);
          mañana.setDate(hoy.getDate() + 1);
          
          if (fecha > mañana) {
            errores.push(`Fila ${index + 2}: La fecha no puede ser futura`);
          }
        });
        break;
    }

    return errores;
  }

  /**
   * Valida formato de email
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
} 