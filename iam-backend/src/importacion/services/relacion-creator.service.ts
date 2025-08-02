import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoProducto, UnidadMedida, EstadoProveedor } from '@prisma/client';

export interface RelacionCreatorOptions {
  empresaId: number;
  etiquetas?: string[];
  tipoProducto?: TipoProducto;
  unidad?: UnidadMedida;
  stockInicial?: number;
  precioCompra?: number;
  precioVenta?: number;
  stockMinimo?: number;
  crearProveedorSiNoExiste?: boolean;
  crearCategoriaSiNoExiste?: boolean;
  generarSKUAutomatico?: boolean;
  prefijoSKU?: string;
}

export interface ResultadoRelacion {
  entidad: any;
  creado: boolean;
  tipo: 'producto' | 'proveedor' | 'categoria';
  identificador: string;
  error?: string;
}

@Injectable()
export class RelacionCreatorService {
  private readonly logger = new Logger(RelacionCreatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca o crea un producto por nombre o ID con validaciones robustas
   */
  async buscarOCrearProducto(
    identificador: string | number,
    options: RelacionCreatorOptions
  ): Promise<ResultadoRelacion> {
    try {
      // Normalizar identificador
      const identificadorNormalizado = this.normalizarIdentificador(identificador);
      
      // Buscar producto existente
      const productoExistente = await this.buscarProducto(identificadorNormalizado, options.empresaId);
      
      if (productoExistente) {
        this.logger.debug(`✅ Producto encontrado: ${productoExistente.nombre} (ID: ${productoExistente.id})`);
        return {
          entidad: productoExistente,
          creado: false,
          tipo: 'producto',
          identificador: identificadorNormalizado
        };
      }

      // Crear producto automáticamente
      const productoNuevo = await this.crearProductoAutomatico(identificadorNormalizado, options);
      
      this.logger.log(`✅ Producto creado automáticamente: ${productoNuevo.nombre} (ID: ${productoNuevo.id})`);
      return {
        entidad: productoNuevo,
        creado: true,
        tipo: 'producto',
        identificador: identificadorNormalizado
      };

    } catch (error) {
      this.logger.error(`❌ Error procesando producto "${identificador}":`, error);
      return {
        entidad: null,
        creado: false,
        tipo: 'producto',
        identificador: String(identificador),
        error: error.message
      };
    }
  }

  /**
   * Busca o crea un proveedor por nombre con validaciones
   */
  async buscarOCrearProveedor(
    nombreProveedor: string,
    empresaId: number,
    crearSiNoExiste: boolean = true
  ): Promise<ResultadoRelacion> {
    try {
      const nombreNormalizado = this.normalizarNombre(nombreProveedor);
      
      if (!nombreNormalizado) {
        throw new Error('Nombre de proveedor no puede estar vacío');
      }

      // Buscar proveedor existente
      const proveedorExistente = await this.buscarProveedor(nombreNormalizado, empresaId);
      
      if (proveedorExistente) {
        this.logger.debug(`✅ Proveedor encontrado: ${proveedorExistente.nombre} (ID: ${proveedorExistente.id})`);
        return {
          entidad: proveedorExistente,
          creado: false,
          tipo: 'proveedor',
          identificador: nombreNormalizado
        };
      }

      if (!crearSiNoExiste) {
        return {
          entidad: null,
          creado: false,
          tipo: 'proveedor',
          identificador: nombreNormalizado,
          error: 'Proveedor no encontrado y creación automática deshabilitada'
        };
      }

      // Crear proveedor automáticamente
      const proveedorNuevo = await this.crearProveedorAutomatico(nombreNormalizado, empresaId);
      
      this.logger.log(`✅ Proveedor creado automáticamente: ${proveedorNuevo.nombre} (ID: ${proveedorNuevo.id})`);
      return {
        entidad: proveedorNuevo,
        creado: true,
        tipo: 'proveedor',
        identificador: nombreNormalizado
      };

    } catch (error) {
      this.logger.error(`❌ Error procesando proveedor "${nombreProveedor}":`, error);
      return {
        entidad: null,
        creado: false,
        tipo: 'proveedor',
        identificador: String(nombreProveedor),
        error: error.message
      };
    }
  }

  /**
   * Procesa múltiples relaciones en lote con transacciones
   */
  async procesarRelacionesEnLote(
    relaciones: Array<{
      tipo: 'producto' | 'proveedor';
      identificador: string | number;
      options?: RelacionCreatorOptions;
      empresaId?: number;
    }>
  ): Promise<ResultadoRelacion[]> {
    const resultados: ResultadoRelacion[] = [];
    
    // Procesar en lotes para mejor rendimiento
    const loteSize = 50;
    for (let i = 0; i < relaciones.length; i += loteSize) {
      const lote = relaciones.slice(i, i + loteSize);
      
      const resultadosLote = await Promise.all(
        lote.map(async (relacion) => {
          try {
            if (relacion.tipo === 'producto') {
              const options = relacion.options || { empresaId: relacion.empresaId! };
              return await this.buscarOCrearProducto(
                relacion.identificador, 
                options
              );
            } else if (relacion.tipo === 'proveedor') {
              if (!relacion.empresaId) {
                throw new Error('empresaId es requerido para proveedores');
              }
              return await this.buscarOCrearProveedor(
                String(relacion.identificador),
                relacion.empresaId
              );
            }
            return {
              entidad: null,
              creado: false,
              tipo: relacion.tipo,
              identificador: String(relacion.identificador),
              error: 'Tipo de relación no soportado'
            };
          } catch (error) {
            this.logger.error(`Error procesando relación ${relacion.tipo}:`, error);
            return {
              entidad: null,
              creado: false,
              tipo: relacion.tipo,
              identificador: String(relacion.identificador),
              error: error.message
            };
          }
        })
      );
      
      resultados.push(...resultadosLote);
    }
    
    return resultados;
  }

  /**
   * Busca un producto existente con múltiples estrategias
   */
  private async buscarProducto(identificador: string, empresaId: number): Promise<any | null> {
    // Estrategia 1: Buscar por ID numérico
    if (!isNaN(parseInt(identificador))) {
      const productoId = parseInt(identificador);
      const producto = await this.prisma.producto.findUnique({
        where: {
          id: productoId,
          empresaId,
          estado: 'ACTIVO'
        }
      });
      if (producto) return producto;
    }

    // Estrategia 2: Buscar por nombre exacto (case-insensitive)
    const productoPorNombre = await this.prisma.producto.findFirst({
      where: {
        nombre: {
          equals: identificador,
          mode: 'insensitive'
        },
        empresaId,
        estado: 'ACTIVO'
      }
    });
    if (productoPorNombre) return productoPorNombre;

    // Estrategia 3: Buscar por código de barras
    const productoPorCodigo = await this.prisma.producto.findFirst({
      where: {
        codigoBarras: {
          equals: identificador,
          mode: 'insensitive'
        },
        empresaId,
        estado: 'ACTIVO'
      }
    });
    if (productoPorCodigo) return productoPorCodigo;

    // Estrategia 4: Buscar por SKU
    const productoPorSKU = await this.prisma.producto.findFirst({
      where: {
        sku: {
          equals: identificador,
          mode: 'insensitive'
        },
        empresaId,
        estado: 'ACTIVO'
      }
    });
    if (productoPorSKU) return productoPorSKU;

    // Estrategia 5: Búsqueda parcial por nombre
    const productoParcial = await this.prisma.producto.findFirst({
      where: {
        nombre: {
          contains: identificador,
          mode: 'insensitive'
        },
        empresaId,
        estado: 'ACTIVO'
      }
    });

    return productoParcial;
  }

  /**
   * Busca un proveedor existente
   */
  private async buscarProveedor(nombre: string, empresaId: number): Promise<any | null> {
    return await this.prisma.proveedor.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        },
        empresaId,
        estado: 'ACTIVO'
      }
    });
  }

  /**
   * Crea un producto automáticamente con validaciones
   */
  private async crearProductoAutomatico(
    nombre: string, 
    options: RelacionCreatorOptions
  ): Promise<any> {
    // Validaciones
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('Nombre de producto no puede estar vacío');
    }

    if (nombre.trim().length > 100) {
      throw new Error('Nombre de producto demasiado largo (máximo 100 caracteres)');
    }

    // Generar códigos únicos
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codigoUnico = `AUTO-${timestamp}-${randomSuffix}`;
    
    // Limpiar y validar el nombre
    const nombreLimpio = this.normalizarNombre(nombre);
    
    // Configurar valores por defecto
    const {
      empresaId,
      etiquetas = ['AUTO-CREADO', 'IMPORTACION-MOVIMIENTOS'],
      tipoProducto = TipoProducto.GENERICO,
      unidad = UnidadMedida.UNIDAD,
      stockInicial = 0,
      precioCompra = 0,
      precioVenta = 0,
      stockMinimo = 10,
      generarSKUAutomatico = true,
      prefijoSKU = 'PROD'
    } = options;
    
    // Generar SKU si está habilitado
    const sku = generarSKUAutomatico 
      ? this.generarSKUAutomatico(nombreLimpio, prefijoSKU)
      : null;

    const productoNuevo = await this.prisma.producto.create({
      data: {
        nombre: nombreLimpio,
        descripcion: `Producto creado automáticamente durante importación: ${nombreLimpio}`,
        stock: stockInicial,
        precioCompra,
        precioVenta,
        stockMinimo,
        codigoBarras: codigoUnico,
        sku,
        rfid: codigoUnico,
        tipoProducto,
        unidad,
        estado: 'ACTIVO',
        empresaId,
        etiquetas,
        version: 1,
      },
    });
    
    return productoNuevo;
  }

  /**
   * Crea un proveedor automáticamente
   */
  private async crearProveedorAutomatico(nombre: string, empresaId: number): Promise<any> {
    // Generar email temporal único con más aleatoriedad
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const emailTemporal = `proveedor-${timestamp}-${randomSuffix}@auto-created.com`;
    
    return await this.prisma.proveedor.create({
      data: {
        nombre: nombre,
        email: emailTemporal,
        telefono: 'Sin teléfono',
        empresaId: empresaId,
        estado: EstadoProveedor.ACTIVO
      }
    });
  }

  /**
   * Normaliza un identificador
   */
  private normalizarIdentificador(identificador: string | number): string {
    return String(identificador).trim();
  }

  /**
   * Normaliza un nombre
   */
  private normalizarNombre(nombre: string): string {
    return nombre.trim().substring(0, 100);
  }

  /**
   * Genera un SKU automático
   */
  private generarSKUAutomatico(nombre: string, prefijo: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const nombreCorto = nombre.substring(0, 10).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return `${prefijo}-${nombreCorto}-${timestamp}-${randomSuffix}`;
  }

  /**
   * Valida si una entidad puede ser creada automáticamente
   */
  async validarCreacionAutomatica(
    tipo: 'producto' | 'proveedor',
    identificador: string,
    empresaId: number
  ): Promise<{ permitido: boolean; razon?: string }> {
    try {
      if (tipo === 'producto') {
        // Validar límites de productos por empresa
        const totalProductos = await this.prisma.producto.count({
          where: { empresaId, estado: 'ACTIVO' }
        });
        
        if (totalProductos >= 10000) {
          return {
            permitido: false,
            razon: 'Límite de productos alcanzado (máximo 10,000)'
          };
        }
      } else if (tipo === 'proveedor') {
        // Validar límites de proveedores por empresa
        const totalProveedores = await this.prisma.proveedor.count({
          where: { empresaId, estado: EstadoProveedor.ACTIVO }
        });
        
        if (totalProveedores >= 1000) {
          return {
            permitido: false,
            razon: 'Límite de proveedores alcanzado (máximo 1,000)'
          };
        }
      }

      return { permitido: true };
    } catch (error) {
      this.logger.error(`Error validando creación automática:`, error);
      return {
        permitido: false,
        razon: 'Error interno durante validación'
      };
    }
  }
} 