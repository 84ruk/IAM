import { Injectable, Logger } from '@nestjs/common';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { ResultadoImportacionRapida } from '../dto/importacion-rapida.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AutocorreccionInteligenteService } from './autocorreccion-inteligente.service';
import { SmartErrorResolverService } from './smart-error-resolver.service';
import { ValidationCacheService } from './validation-cache.service';
import { ProductoCreatorService } from './producto-creator.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportacionRapidaService {
  private readonly logger = new Logger(ImportacionRapidaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autocorreccionService: AutocorreccionInteligenteService,
    private readonly smartErrorResolver: SmartErrorResolverService,
    private readonly validationCache: ValidationCacheService,
    private readonly productoCreator: ProductoCreatorService,
  ) {}

  async procesarImportacionRapida(
    file: Express.Multer.File,
    tipo: string,
    user: JwtUser,
    opciones?: any,
  ): Promise<ResultadoImportacionRapida> {
    this.logger.log(`Procesando importación rápida - Tipo: ${tipo}, Archivo: ${file.originalname}`);
    
    try {
      // Leer archivo - usar file.path si está disponible (diskStorage), sino file.buffer
      let workbook;
      if (file.path) {
        // Archivo guardado en disco
        workbook = XLSX.readFile(file.path);
        this.logger.log(`Archivo leído desde disco: ${file.path}`);
      } else if (file.buffer) {
        // Archivo en memoria
        workbook = XLSX.read(file.buffer, { type: 'buffer' });
        this.logger.log(`Archivo leído desde buffer`);
      } else {
        throw new Error('No se pudo leer el archivo: ni path ni buffer disponibles');
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
      }

      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];

      this.logger.log(`Archivo procesado: ${rows.length} registros encontrados`);

      let resultado: ResultadoImportacionRapida;

      // Procesar según el tipo
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

      // Solo limpiar archivo temporal si NO es una importación con WebSocket
      // Si hay opciones, significa que viene de una importación con seguimiento
      const esImportacionConWebSocket = opciones && Object.keys(opciones).length > 0;
      
      if (!esImportacionConWebSocket && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          this.logger.log(`Archivo temporal eliminado (importación rápida): ${file.path}`);
        } catch (error) {
          this.logger.warn(`No se pudo eliminar archivo temporal: ${file.path}`);
        }
      } else if (esImportacionConWebSocket) {
        this.logger.log(`Archivo temporal mantenido para WebSocket: ${file.path}`);
      }

      this.logger.log(
        `Importación rápida completada - Exitosos: ${resultado.registrosExitosos}, Errores: ${resultado.registrosConError}`,
      );

      return resultado;
    } catch (error) {
      this.logger.error(`Error procesando importación rápida: ${error.message}`, error.stack);
      
      // Solo limpiar archivo temporal en caso de error si NO es WebSocket
      const esImportacionConWebSocket = opciones && Object.keys(opciones).length > 0;
      
      if (!esImportacionConWebSocket && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          this.logger.log(`Archivo temporal eliminado después de error: ${file.path}`);
        } catch (cleanupError) {
          this.logger.warn(`No se pudo eliminar archivo temporal después de error: ${file.path}`);
        }
      }
      
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
    const todasLasCorrecciones: any[] = [];
    const registrosExitososDetalle: any[] = []; // Nueva lista para detalles

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 porque empezamos desde la fila 2 (después del header)

      let productoData: any;
      try {
        // Mapear datos según headers con autocorrección
        const { producto, correcciones } = await this.mapearFilaAProducto(row, headers, rowNumber);
        productoData = producto;
        
        // Agregar correcciones a la lista global
        if (correcciones.length > 0) {
          correcciones.forEach(correccion => {
            todasLasCorrecciones.push({
              ...correccion,
              fila: rowNumber,
              datosOriginales: row
            });
          });
        }

        // Validar datos
        const validacion = this.validarProducto(productoData);
        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
            tipo: 'validacion',
            datosOriginales: row,
            campoEspecifico: validacion.columna,
            valorRecibido: validacion.valor,
            valorEsperado: validacion.valorEsperado,
            sugerencia: validacion.sugerencia
          });
          continue;
        }

        // Verificar duplicados antes de crear
        if (user.empresaId) {
          const duplicados = await this.verificarDuplicadosProducto(productoData, user.empresaId);
          if (duplicados.length > 0) {
            errores.push({
              fila: rowNumber,
              columna: 'duplicado',
              valor: productoData.nombre,
              mensaje: `Producto duplicado: ${duplicados.join(', ')}`,
              tipo: 'duplicado',
              datosOriginales: row,
              campoEspecifico: 'identificadores únicos',
              valorRecibido: productoData.nombre,
              valorEsperado: 'Valor único en la base de datos',
              sugerencia: 'Verificar si desea actualizar el registro existente o usar un identificador único'
            });
            continue;
          }
        }

        // Guardar producto
        const productoGuardado = await this.prisma.producto.create({
          data: {
            ...productoData,
            empresaId: user.empresaId,
            // usuarioId no existe en el modelo Producto, solo empresaId
          },
        });

        // Registrar el registro exitoso con detalles
        registrosExitososDetalle.push({
          fila: rowNumber,
          tipo: 'productos',
          datos: {
            id: productoGuardado.id,
            nombre: productoGuardado.nombre,
            descripcion: productoGuardado.descripcion,
            stock: productoGuardado.stock,
            precioCompra: productoGuardado.precioCompra,
            precioVenta: productoGuardado.precioVenta,
            stockMinimo: productoGuardado.stockMinimo,
            codigoBarras: productoGuardado.codigoBarras,
            sku: productoGuardado.sku,
            tipoProducto: productoGuardado.tipoProducto,
            unidad: productoGuardado.unidad,
            estado: productoGuardado.estado,
            etiquetas: productoGuardado.etiquetas,
            color: productoGuardado.color,
            talla: productoGuardado.talla,
            ubicacion: productoGuardado.ubicacion,
            temperaturaOptima: productoGuardado.temperaturaOptima,
            humedadOptima: productoGuardado.humedadOptima,
            rfid: productoGuardado.rfid
          },
          identificador: productoGuardado.nombre,
          correccionesAplicadas: correcciones.length > 0 ? correcciones : undefined,
          timestamp: new Date()
        });

        registrosExitosos++;
        
        // Log individual de cada registro exitoso
        this.logger.log(`✅ Producto importado exitosamente - Fila ${rowNumber}: "${productoGuardado.nombre}" (ID: ${productoGuardado.id})`);
        
      } catch (error) {
        let productoData: any = {};
        try {
          const mapeoResult = await this.mapearFilaAProducto(row, headers, rowNumber);
          productoData = mapeoResult.producto;
        } catch (mapeoError) {
          productoData = {};
        }

        const errorMessage = this.interpretarErrorPrisma(error, productoData || {});
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: errorMessage,
          tipo: 'error_db',
          datosOriginales: row,
          campoEspecifico: 'base de datos',
          valorRecibido: JSON.stringify(productoData || {}),
          valorEsperado: 'Datos válidos según esquema de base de datos',
          sugerencia: this.obtenerSugerenciaError(error),
          codigoError: error.code || 'UNKNOWN'
        });
      }
    }

    // Log de correcciones aplicadas
    if (todasLasCorrecciones.length > 0) {
      this.logger.log(`Se aplicaron ${todasLasCorrecciones.length} correcciones automáticas durante la importación de productos`);
      this.logger.debug('Correcciones aplicadas:', todasLasCorrecciones);
    }

    // Log resumen final
    this.logger.log(`📊 Resumen importación productos: ${registrosExitosos} exitosos, ${errores.length} errores de ${rows.length} total`);

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      correcciones: todasLasCorrecciones, // Incluir correcciones en el resultado
      registrosExitososDetalle, // Incluir detalles de registros exitosos
      resumen: {
        tipo: 'productos',
        empresaId: user.empresaId?.toString() || '',
        usuarioId: user.id.toString(),
        fechaProcesamiento: new Date(),
        correccionesAplicadas: todasLasCorrecciones.length,
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
    const registrosExitososDetalle: any[] = []; // Nueva lista para detalles

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      let proveedorData: any;
      try {
        proveedorData = this.mapearFilaAProveedor(row, headers, rowNumber);
        const validacion = this.validarProveedor(proveedorData);

        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
            tipo: 'validacion',
            datosOriginales: row,
            campoEspecifico: validacion.columna,
            valorRecibido: validacion.valor,
            valorEsperado: validacion.valorEsperado,
            sugerencia: validacion.sugerencia
          });
          continue;
        }

        // Verificar duplicados antes de crear
        if (user.empresaId) {
          const duplicados = await this.verificarDuplicadosProveedor(proveedorData, user.empresaId);
          if (duplicados.length > 0) {
            errores.push({
              fila: rowNumber,
              columna: 'duplicado',
              valor: proveedorData.nombre,
              mensaje: `Proveedor duplicado: ${duplicados.join(', ')}`,
              tipo: 'duplicado',
              datosOriginales: row,
              campoEspecifico: 'identificadores únicos',
              valorRecibido: proveedorData.nombre,
              valorEsperado: 'Valor único en la base de datos',
              sugerencia: 'Verificar si desea actualizar el registro existente o usar un identificador único'
            });
            continue;
          }
        }

        const proveedorGuardado = await this.prisma.proveedor.create({
          data: {
            ...proveedorData,
            empresaId: user.empresaId,
            // usuarioId no existe en el modelo Proveedor, solo empresaId
          },
        });

        // Registrar el registro exitoso con detalles
        registrosExitososDetalle.push({
          fila: rowNumber,
          tipo: 'proveedores',
          datos: {
            id: proveedorGuardado.id,
            nombre: proveedorGuardado.nombre,
            email: proveedorGuardado.email,
            telefono: proveedorGuardado.telefono,
            estado: proveedorGuardado.estado,
            empresaId: proveedorGuardado.empresaId
          },
          identificador: proveedorGuardado.nombre,
          timestamp: new Date()
        });

        registrosExitosos++;
        
        // Log individual de cada registro exitoso
        this.logger.log(`✅ Proveedor importado exitosamente - Fila ${rowNumber}: "${proveedorGuardado.nombre}" (ID: ${proveedorGuardado.id})`);
        
      } catch (error) {
        const errorMessage = this.interpretarErrorPrisma(error, proveedorData || {});
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: errorMessage,
          tipo: 'error_db',
          datosOriginales: row,
          campoEspecifico: 'base de datos',
          valorRecibido: JSON.stringify(proveedorData || {}),
          valorEsperado: 'Datos válidos según esquema de base de datos',
          sugerencia: this.obtenerSugerenciaError(error),
          codigoError: error.code || 'UNKNOWN'
        });
      }
    }

    // Log resumen final
    this.logger.log(`📊 Resumen importación proveedores: ${registrosExitosos} exitosos, ${errores.length} errores de ${rows.length} total`);

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      registrosExitososDetalle, // Incluir detalles de registros exitosos
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
    // Validar que el usuario tenga empresaId
    if (!user.empresaId) {
      throw new Error('El usuario debe tener una empresa configurada para importar movimientos');
    }

    // ✅ NUEVO: Cache de proveedores para mejorar rendimiento
    const cacheProveedores = new Map<string, any>();
    const cacheProveedoresPorId = new Map<number, any>();
    
    // Cargar todos los proveedores activos de la empresa en cache
    try {
      const proveedoresExistentes = await this.prisma.proveedor.findMany({
        where: {
          empresaId: user.empresaId,
          estado: 'ACTIVO'
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true
        }
      });

      // Llenar cache
      proveedoresExistentes.forEach(proveedor => {
        const nombreNormalizado = this.normalizarNombreProveedor(proveedor.nombre);
        cacheProveedores.set(nombreNormalizado.toLowerCase(), proveedor);
        cacheProveedores.set(proveedor.nombre.toLowerCase(), proveedor);
        cacheProveedoresPorId.set(proveedor.id, proveedor);
      });

      this.logger.debug(`📦 Cache de proveedores cargado: ${proveedoresExistentes.length} proveedores`);
    } catch (error) {
      this.logger.warn(`⚠️ Error cargando cache de proveedores: ${error.message}`);
    }

    const errores: any[] = [];
    let registrosExitosos = 0;
    const registrosExitososDetalle: any[] = []; // Nueva lista para detalles

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      let movimientoData: any;
      try {
        movimientoData = this.mapearFilaAMovimiento(row, headers, rowNumber);
        const validacion = this.validarMovimiento(movimientoData);

        if (!validacion.valido) {
          errores.push({
            fila: rowNumber,
            columna: validacion.columna,
            valor: validacion.valor,
            mensaje: validacion.mensaje,
            tipo: 'validacion',
            datosOriginales: row,
            campoEspecifico: validacion.columna,
            valorRecibido: validacion.valor,
            valorEsperado: validacion.valorEsperado,
            sugerencia: validacion.sugerencia
          });
          continue;
        }

        // ✅ MEJORADO: Resolver productoId/productoNombre - verificar si existe el producto
        let productoIdFinal = movimientoData.productoId;
        let productoEncontrado = false;
        let productoNombre = '';
        let productoCreado = false;

        // Determinar el identificador del producto (ID o nombre)
        const identificadorProducto = movimientoData.productoNombre || movimientoData.productoId;
        
        if (!identificadorProducto) {
          errores.push({
            fila: rowNumber,
            columna: 'producto',
            valor: 'No especificado',
            mensaje: 'Se requiere productoId o productoNombre',
            tipo: 'validacion',
            datosOriginales: row,
            campoEspecifico: 'producto',
            valorRecibido: 'No especificado',
            valorEsperado: 'ID de producto o nombre de producto',
            sugerencia: 'Agregue una columna con productoId o productoNombre'
          });
          continue;
        }

        try {
          // ✅ MEJORADO: Calcular precios base del producto basado en el movimiento
          let precioCompraBase = 0;
          let precioVentaBase = 0;
          
          if (movimientoData.precioUnitario && movimientoData.precioUnitario > 0) {
            // Lógica simplificada: usar el precio unitario directamente
            if (movimientoData.tipoPrecio === 'VENTA') {
              // Si es venta, usar como precio de venta
              precioVentaBase = movimientoData.precioUnitario;
              precioCompraBase = movimientoData.precioUnitario; // Mismo precio para compra
            } else {
              // Si es compra, ajuste, transferencia, usar como precio de compra
              precioCompraBase = movimientoData.precioUnitario;
              precioVentaBase = movimientoData.precioUnitario; // Mismo precio para venta
            }
          }
          
          // Usar el servicio de creación de productos para buscar o crear automáticamente
          const resultadoProducto = await this.productoCreator.buscarOCrearProducto(
            identificadorProducto,
            {
              empresaId: user.empresaId,
              etiquetas: ['AUTO-CREADO', 'IMPORTACION-MOVIMIENTOS'],
              stockInicial: 0,
              precioCompra: precioCompraBase,
              precioVenta: precioVentaBase,
              stockMinimo: 10
            }
          );

          productoIdFinal = resultadoProducto.producto.id;
          productoEncontrado = true;
          productoNombre = resultadoProducto.producto.nombre;
          productoCreado = resultadoProducto.creado;

          if (productoCreado) {
            this.logger.log(`✅ Producto creado automáticamente: "${identificadorProducto}" -> ID: ${productoIdFinal} (Precio Compra: $${precioCompraBase}, Precio Venta: $${precioVentaBase})`);
          } else {
            this.logger.debug(`Producto encontrado: "${identificadorProducto}" -> ID: ${productoIdFinal}`);
          }
        } catch (busquedaError) {
          errores.push({
            fila: rowNumber,
            columna: 'producto',
            valor: movimientoData.productoId,
            mensaje: busquedaError.message,
            tipo: 'validacion',
            datosOriginales: row,
            campoEspecifico: 'producto',
            valorRecibido: movimientoData.productoId,
            valorEsperado: 'Nombre de producto existente o ID válido',
            sugerencia: 'Verifique que el producto existe en el sistema o use el ID numérico correcto'
          });
          continue;
        }

        if (!productoEncontrado) {
          errores.push({
            fila: rowNumber,
            columna: 'producto',
            valor: movimientoData.productoId,
            mensaje: 'No se pudo resolver el producto',
            tipo: 'validacion',
            datosOriginales: row,
            campoEspecifico: 'producto',
            valorRecibido: movimientoData.productoId,
            valorEsperado: 'Nombre de producto existente o ID válido',
            sugerencia: 'Verifique que el producto existe en el sistema'
          });
          continue;
        }

        // ✅ MEJORADO: Resolver proveedorId/proveedorNombre - buscar o crear proveedor automáticamente
        let proveedorIdFinal = movimientoData.proveedorId;
        let proveedorEncontrado = false;
        let proveedorNombre = '';
        let proveedorCreado = false;

        // Determinar el identificador del proveedor (ID o nombre)
        const identificadorProveedor = movimientoData.proveedorNombre || movimientoData.proveedorId;

        if (identificadorProveedor) {
                      try {
              // Si es un número, buscar por ID en cache primero
              if (typeof identificadorProveedor === 'number') {
                let proveedorExistente: any = cacheProveedoresPorId.get(identificadorProveedor);
                
                if (!proveedorExistente) {
                  // Si no está en cache, buscar en base de datos
                  proveedorExistente = await this.prisma.proveedor.findFirst({
                    where: {
                      id: identificadorProveedor,
                      empresaId: user.empresaId,
                      estado: 'ACTIVO'
                    }
                  });
                }

                if (proveedorExistente) {
                  proveedorIdFinal = proveedorExistente.id;
                  proveedorEncontrado = true;
                  proveedorNombre = proveedorExistente.nombre;
                  this.logger.debug(`Proveedor encontrado por ID: "${proveedorExistente.nombre}" (ID: ${proveedorExistente.id})`);
                } else {
                  this.logger.warn(`Proveedor con ID ${identificadorProveedor} no encontrado, se omitirá`);
                  proveedorIdFinal = null;
                }
              } else {
                // Si es un string, buscar por nombre o crear automáticamente
                const nombreProveedor = String(identificadorProveedor).trim();
              
              // ✅ MEJORADO: Búsqueda más flexible de proveedor existente usando cache
              let proveedorExistente: any = null;
              
              // 1. Búsqueda en cache por nombre exacto
              proveedorExistente = cacheProveedores.get(nombreProveedor.toLowerCase());
              
              // 2. Si no se encuentra, buscar por nombre normalizado en cache
              if (!proveedorExistente) {
                const nombreNormalizado = this.normalizarNombreProveedor(nombreProveedor);
                proveedorExistente = cacheProveedores.get(nombreNormalizado.toLowerCase());
              }

              // 3. Si aún no se encuentra, buscar en base de datos
              if (!proveedorExistente) {
                proveedorExistente = await this.prisma.proveedor.findFirst({
                  where: {
                    nombre: {
                      equals: nombreProveedor,
                      mode: 'insensitive'
                    },
                    empresaId: user.empresaId,
                    estado: 'ACTIVO'
                  }
                });
              }

              // 4. Si no se encuentra, buscar por nombre normalizado en base de datos
              if (!proveedorExistente) {
                const nombreNormalizado = this.normalizarNombreProveedor(nombreProveedor);
                proveedorExistente = await this.prisma.proveedor.findFirst({
                  where: {
                    nombre: {
                      equals: nombreNormalizado,
                      mode: 'insensitive'
                    },
                    empresaId: user.empresaId,
                    estado: 'ACTIVO'
                  }
                });
              }

              // 5. Si aún no se encuentra, buscar por nombre parcial (contiene)
              if (!proveedorExistente) {
                proveedorExistente = await this.prisma.proveedor.findFirst({
                  where: {
                    nombre: {
                      contains: nombreProveedor,
                      mode: 'insensitive'
                    },
                    empresaId: user.empresaId,
                    estado: 'ACTIVO'
                  }
                });
              }

              if (proveedorExistente) {
                proveedorIdFinal = proveedorExistente.id;
                proveedorEncontrado = true;
                proveedorNombre = proveedorExistente.nombre;
                this.logger.debug(`Proveedor encontrado por nombre: "${proveedorExistente.nombre}" (ID: ${proveedorExistente.id})`);
              } else {
                // ✅ MEJORADO: Crear proveedor automáticamente con mejor manejo
                try {
                  // ✅ NUEVO: Validar límites antes de crear proveedor
                  const totalProveedores = await this.prisma.proveedor.count({
                    where: {
                      empresaId: user.empresaId,
                      estado: 'ACTIVO'
                    }
                  });

                  if (totalProveedores >= 1000) {
                    this.logger.warn(`⚠️ Límite de proveedores alcanzado (${totalProveedores}/1000). No se puede crear más proveedores automáticamente.`);
                    proveedorIdFinal = null;
                  } else {
                    const timestamp = Date.now();
                    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const emailTemporal = `proveedor-${timestamp}-${randomSuffix}@auto-created.com`;
                    
                    // Normalizar el nombre antes de crear
                    const nombreNormalizado = this.normalizarNombreProveedor(nombreProveedor);
                    
                    const proveedorNuevo = await this.prisma.proveedor.create({
                      data: {
                        nombre: nombreNormalizado,
                        email: emailTemporal,
                        telefono: 'Sin teléfono',
                        empresaId: user.empresaId,
                        estado: 'ACTIVO'
                      }
                    });

                    proveedorIdFinal = proveedorNuevo.id;
                    proveedorEncontrado = true;
                    proveedorNombre = proveedorNuevo.nombre;
                    proveedorCreado = true;
                    
                    // ✅ NUEVO: Actualizar cache con el nuevo proveedor
                    cacheProveedores.set(nombreNormalizado.toLowerCase(), proveedorNuevo);
                    cacheProveedores.set(proveedorNuevo.nombre.toLowerCase(), proveedorNuevo);
                    cacheProveedoresPorId.set(proveedorNuevo.id, proveedorNuevo);
                    
                    this.logger.log(`✅ Proveedor creado automáticamente: "${nombreNormalizado}" (ID: ${proveedorNuevo.id})`);
                  }
                } catch (crearError) {
                  this.logger.error(`❌ Error creando proveedor "${nombreProveedor}": ${crearError.message}`);
                  // Intentar crear con nombre alternativo si hay conflicto
                  try {
                    const timestampAlternativo = Date.now();
                    const randomSuffixAlternativo = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const emailTemporalAlternativo = `proveedor-${timestampAlternativo}-${randomSuffixAlternativo}@auto-created.com`;
                    const nombreAlternativo = `${nombreProveedor} (${timestampAlternativo})`;
                    const proveedorNuevo = await this.prisma.proveedor.create({
                      data: {
                        nombre: nombreAlternativo,
                        email: emailTemporalAlternativo,
                        telefono: 'Sin teléfono',
                        empresaId: user.empresaId,
                        estado: 'ACTIVO'
                      }
                    });
                    
                    proveedorIdFinal = proveedorNuevo.id;
                    proveedorEncontrado = true;
                    proveedorNombre = proveedorNuevo.nombre;
                    proveedorCreado = true;
                    this.logger.log(`✅ Proveedor creado con nombre alternativo: "${nombreAlternativo}" (ID: ${proveedorNuevo.id})`);
                  } catch (errorAlternativo) {
                    this.logger.error(`❌ Error creando proveedor alternativo: ${errorAlternativo.message}`);
                    proveedorIdFinal = null;
                  }
                }
              }
            }
          } catch (proveedorError) {
            this.logger.warn(`⚠️ Error procesando proveedor "${movimientoData.proveedorId}": ${proveedorError.message}`);
            // No fallar la importación por error de proveedor, solo omitirlo
            proveedorIdFinal = null;
          }
        }

        // Crear el movimiento con el productoId y proveedorId resueltos
        // ✅ CORREGIDO: Solo incluir campos válidos del modelo MovimientoInventario
        const datosMovimiento = {
          tipo: movimientoData.tipo,
          cantidad: movimientoData.cantidad,
          motivo: movimientoData.motivo,
          descripcion: movimientoData.descripcion,
          fecha: movimientoData.fecha,
          estado: movimientoData.estado,
          precioUnitario: movimientoData.precioUnitario,
          precioTotal: movimientoData.precioTotal,
          tipoPrecio: movimientoData.tipoPrecio,
          productoId: productoIdFinal,
          empresaId: user.empresaId,
          proveedorId: proveedorIdFinal,
        };

        const movimientoGuardado = await this.prisma.movimientoInventario.create({
          data: datosMovimiento,
        });

        // Actualizar el stock del producto automáticamente
        try {
          await this.productoCreator.actualizarStock(
            productoIdFinal,
            movimientoData.cantidad,
            movimientoData.tipo
          );
          this.logger.log(`✅ Stock actualizado automáticamente para producto ${productoNombre}`);
        } catch (stockError) {
          this.logger.error(`❌ Error actualizando stock para producto ${productoNombre}:`, stockError);
          // No fallar la importación por error de stock, solo loggear
        }

        // Registrar el registro exitoso con detalles
        registrosExitososDetalle.push({
          fila: rowNumber,
          tipo: 'movimientos',
          datos: {
            id: movimientoGuardado.id,
            tipo: movimientoGuardado.tipo,
            cantidad: movimientoGuardado.cantidad,
            descripcion: movimientoGuardado.descripcion,
            fecha: movimientoGuardado.fecha,
            estado: movimientoGuardado.estado,
            productoId: movimientoGuardado.productoId,
            productoNombre: productoNombre,
            productoCreado: productoCreado,
            // ✅ NUEVO: Información del proveedor
            proveedorId: movimientoGuardado.proveedorId,
            proveedorNombre: proveedorNombre,
            proveedorCreado: proveedorCreado,
            // ✅ NUEVO: Información de precios
            precioUnitario: movimientoGuardado.precioUnitario,
            precioTotal: movimientoGuardado.precioTotal,
            tipoPrecio: movimientoGuardado.tipoPrecio
          },
          identificador: `${movimientoGuardado.tipo} - ${productoNombre} (${movimientoGuardado.cantidad})${productoCreado ? ' [Producto creado]' : ''}${proveedorCreado ? ' [Proveedor creado]' : ''}`,
          timestamp: new Date()
        });

        registrosExitosos++;
        
        // Log individual de cada registro exitoso
        const logMessage = productoCreado 
          ? `✅ Movimiento importado exitosamente - Fila ${rowNumber}: ${movimientoGuardado.tipo} de ${movimientoGuardado.cantidad} unidades de "${productoNombre}" (ID: ${movimientoGuardado.id}) [Producto creado automáticamente]`
          : `✅ Movimiento importado exitosamente - Fila ${rowNumber}: ${movimientoGuardado.tipo} de ${movimientoGuardado.cantidad} unidades de "${productoNombre}" (ID: ${movimientoGuardado.id})`;
        
        this.logger.log(logMessage);
        
        // ✅ NUEVO: Log adicional para proveedor si fue creado
        if (proveedorCreado) {
          this.logger.log(`✅ Proveedor creado automáticamente: "${proveedorNombre}" (ID: ${proveedorIdFinal})`);
        }
        
      } catch (error) {
        let movimientoData: any = {};
        try {
          movimientoData = this.mapearFilaAMovimiento(row, headers, rowNumber);
        } catch (mapeoError) {
          movimientoData = {};
        }

        const errorMessage = this.interpretarErrorPrisma(error, movimientoData || {});
        errores.push({
          fila: rowNumber,
          columna: 'general',
          valor: row.join(', '),
          mensaje: errorMessage,
          tipo: 'error_db',
          datosOriginales: row,
          campoEspecifico: 'base de datos',
          valorRecibido: JSON.stringify(movimientoData || {}),
          valorEsperado: 'Datos válidos según esquema de base de datos',
          sugerencia: this.obtenerSugerenciaError(error),
          codigoError: error.code || 'UNKNOWN'
        });
      }
    }

    // Log resumen final
    this.logger.log(`📊 Resumen importación movimientos: ${registrosExitosos} exitosos, ${errores.length} errores de ${rows.length} total`);

    // ✅ NUEVO: Estadísticas de proveedores
    const proveedoresCreados = registrosExitososDetalle.filter(r => r.datos.proveedorCreado).length;
    const proveedoresExistentes = registrosExitososDetalle.filter(r => r.datos.proveedorId && !r.datos.proveedorCreado).length;
    
    if (proveedoresCreados > 0 || proveedoresExistentes > 0) {
      this.logger.log(`🏢 Estadísticas de proveedores: ${proveedoresCreados} creados automáticamente, ${proveedoresExistentes} existentes utilizados`);
    }

    return {
      registrosProcesados: rows.length,
      registrosExitosos,
      registrosConError: errores.length,
      errores,
      registrosExitososDetalle, // Incluir detalles de registros exitosos
      resumen: {
        tipo: 'movimientos',
        empresaId: user.empresaId?.toString() || '',
        usuarioId: user.id.toString(),
        fechaProcesamiento: new Date(),
        // ✅ NUEVO: Estadísticas adicionales
        estadisticasProveedores: {
          creados: proveedoresCreados,
          existentes: proveedoresExistentes,
          total: proveedoresCreados + proveedoresExistentes
        }
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
  private async mapearFilaAProducto(row: any[], headers: string[], rowNumber: number) {
    const producto: any = {};
    const correcciones: any[] = [];
    
    // Campos válidos del modelo Producto
    const camposValidos = [
      'nombre', 'descripcion', 'stock', 'precioCompra', 'precioVenta', 'stockMinimo',
      'codigoBarras', 'sku', 'rfid', 'tipoProducto', 'unidad', 'color', 'talla',
      'ubicacion', 'humedadOptima', 'temperaturaOptima', 'estado', 'etiquetas'
    ];
    
    headers.forEach((header, index) => {
      const value = row[index];
      const headerLower = header.toLowerCase();
      
      // Solo mapear campos válidos
      switch (headerLower) {
        case 'nombre':
          // Aplicar autocorrección inteligente al nombre
          const correccionNombre = this.autocorreccionService.normalizarCampo(value, 'nombre', 'productos');
          producto.nombre = correccionNombre.valorCorregido;
          if (correccionNombre.valorCorregido !== value) {
            correcciones.push({
              campo: 'nombre',
              valorOriginal: value,
              valorCorregido: correccionNombre.valorCorregido,
              tipo: 'normalizacion',
              confianza: correccionNombre.confianza
            });
          }
          break;
        case 'descripcion':
          // Aplicar autocorrección a la descripción
          const correccionDesc = this.autocorreccionService.normalizarCampo(value, 'descripcion', 'productos');
          producto.descripcion = correccionDesc.valorCorregido;
          if (correccionDesc.valorCorregido !== value) {
            correcciones.push({
              campo: 'descripcion',
              valorOriginal: value,
              valorCorregido: correccionDesc.valorCorregido,
              tipo: 'normalizacion',
              confianza: correccionDesc.confianza
            });
          }
          break;
        case 'precio':
        case 'precioventa':
          // Normalizar formato de precio
          const precioVentaNormalizado = this.normalizarPrecio(value);
          producto.precioVenta = parseFloat(precioVentaNormalizado) || 0;
          if (precioVentaNormalizado !== value) {
            correcciones.push({
              campo: 'precioVenta',
              valorOriginal: value,
              valorCorregido: precioVentaNormalizado,
              tipo: 'formato',
              confianza: 90
            });
          }
          break;
        case 'preciocompra':
        case 'precio_compra':
          // Normalizar formato de precio
          const precioCompraNormalizado = this.normalizarPrecio(value);
          producto.precioCompra = parseFloat(precioCompraNormalizado) || 0;
          if (precioCompraNormalizado !== value) {
            correcciones.push({
              campo: 'precioCompra',
              valorOriginal: value,
              valorCorregido: precioCompraNormalizado,
              tipo: 'formato',
              confianza: 90
            });
          }
          break;
        case 'stock':
          // Normalizar stock
          const stockNormalizado = this.normalizarNumero(value);
          producto.stock = parseInt(stockNormalizado) || 0;
          if (stockNormalizado !== value) {
            correcciones.push({
              campo: 'stock',
              valorOriginal: value,
              valorCorregido: stockNormalizado,
              tipo: 'formato',
              confianza: 85
            });
          }
          break;
        case 'codigobarras':
        case 'codigo_barras':
          // Normalizar código de barras
          const codigoBarrasNormalizado = this.normalizarCodigoBarras(value);
          producto.codigoBarras = codigoBarrasNormalizado;
          if (codigoBarrasNormalizado !== value) {
            correcciones.push({
              campo: 'codigoBarras',
              valorOriginal: value,
              valorCorregido: codigoBarrasNormalizado,
              tipo: 'formato',
              confianza: 80
            });
          }
          break;
        case 'sku':
          // Normalizar SKU
          const skuNormalizado = this.normalizarSKU(value);
          producto.sku = skuNormalizado;
          if (skuNormalizado !== value) {
            correcciones.push({
              campo: 'sku',
              valorOriginal: value,
              valorCorregido: skuNormalizado,
              tipo: 'formato',
              confianza: 85
            });
          }
          break;
        case 'rfid':
          // Normalizar RFID
          const rfidNormalizado = this.normalizarRFID(value);
          producto.rfid = rfidNormalizado;
          if (rfidNormalizado !== value) {
            correcciones.push({
              campo: 'rfid',
              valorOriginal: value,
              valorCorregido: rfidNormalizado,
              tipo: 'formato',
              confianza: 85
            });
          }
          break;
        case 'stockminimo':
        case 'stock_minimo':
          // Normalizar stock mínimo
          const stockMinimoNormalizado = this.normalizarNumero(value);
          producto.stockMinimo = parseInt(stockMinimoNormalizado) || 10;
          if (stockMinimoNormalizado !== value) {
            correcciones.push({
              campo: 'stockMinimo',
              valorOriginal: value,
              valorCorregido: stockMinimoNormalizado,
              tipo: 'formato',
              confianza: 85
            });
          }
          break;
        case 'tipo':
        case 'tipoproducto':
          // Normalizar tipo de producto
          const tipoProductoNormalizado = this.normalizarTipoProducto(value);
          producto.tipoProducto = tipoProductoNormalizado;
          if (tipoProductoNormalizado !== value) {
            correcciones.push({
              campo: 'tipoProducto',
              valorOriginal: value,
              valorCorregido: tipoProductoNormalizado,
              tipo: 'normalizacion',
              confianza: 75
            });
          }
          break;
        case 'unidad':
        case 'unidadmedida':
          // Normalizar unidad de medida
          const unidadNormalizada = this.normalizarUnidadMedida(value);
          producto.unidad = unidadNormalizada;
          if (unidadNormalizada !== value) {
            correcciones.push({
              campo: 'unidad',
              valorOriginal: value,
              valorCorregido: unidadNormalizada,
              tipo: 'normalizacion',
              confianza: 80
            });
          }
          break;
        case 'color':
          producto.color = value;
          break;
        case 'talla':
          producto.talla = value;
          break;
        case 'ubicacion':
          producto.ubicacion = value;
          break;
        case 'humedadoptima':
        case 'humedad_optima':
          const humedadNormalizada = this.normalizarNumero(value);
          producto.humedadOptima = parseFloat(humedadNormalizada) || null;
          if (humedadNormalizada !== value) {
            correcciones.push({
              campo: 'humedadOptima',
              valorOriginal: value,
              valorCorregido: humedadNormalizada,
              tipo: 'formato',
              confianza: 85
            });
          }
          break;
        case 'temperaturaoptima':
        case 'temperatura_optima':
          const temperaturaNormalizada = this.normalizarNumero(value);
          producto.temperaturaOptima = parseFloat(temperaturaNormalizada) || null;
          if (temperaturaNormalizada !== value) {
            correcciones.push({
              campo: 'temperaturaOptima',
              valorOriginal: value,
              valorCorregido: temperaturaNormalizada,
              tipo: 'formato',
              confianza: 85
            });
          }
          break;
        case 'estado':
          // Normalizar estado
          const estadoNormalizado = this.normalizarEstado(value);
          producto.estado = estadoNormalizado;
          if (estadoNormalizado !== value) {
            correcciones.push({
              campo: 'estado',
              valorOriginal: value,
              valorCorregido: estadoNormalizado,
              tipo: 'normalizacion',
              confianza: 80
            });
          }
          break;
        case 'etiquetas':
          // Normalizar etiquetas
          if (value) {
            const etiquetasNormalizadas = this.normalizarEtiquetas(value);
            producto.etiquetas = etiquetasNormalizadas;
            if (etiquetasNormalizadas.join(',') !== value) {
              correcciones.push({
                campo: 'etiquetas',
                valorOriginal: value,
                valorCorregido: etiquetasNormalizadas.join(', '),
                tipo: 'normalizacion',
                confianza: 75
              });
            }
          }
          break;
        // Ignorar campos que no existen en el modelo
        case 'categoria':
        case 'proveedor':
        case 'usuario':
        case 'usuario_id':
        case 'user':
        case 'user_id':
          // Estos campos no existen en el modelo Producto, se ignoran
          break;
        default:
          // Log de campos no reconocidos para debugging
          this.logger.debug(`Campo no reconocido en producto: ${header}`);
          break;
      }
    });

    // Asegurar que precioCompra y precioVenta tengan valores por defecto si no se proporcionan
    if (producto.precioCompra === undefined || producto.precioCompra === null) {
      producto.precioCompra = producto.precioVenta || 0;
    }
    if (producto.precioVenta === undefined || producto.precioVenta === null) {
      producto.precioVenta = producto.precioCompra || 0;
    }

    return { producto, correcciones };
  }

  private mapearFilaAProveedor(row: any[], headers: string[], rowNumber: number) {
    const proveedor: any = {};
    
    // Campos válidos del modelo Proveedor
    const camposValidos = ['nombre', 'email', 'telefono'];
    
    headers.forEach((header, index) => {
      const value = row[index];
      const headerLower = header.toLowerCase();
      
      // Solo mapear campos válidos
      switch (headerLower) {
        case 'nombre':
          proveedor.nombre = value;
          break;
        case 'email':
          proveedor.email = value;
          break;
        case 'telefono':
          proveedor.telefono = value;
          break;
        // Ignorar campos que no existen en el modelo
        case 'direccion':
        case 'usuario':
        case 'usuario_id':
        case 'user':
        case 'user_id':
          // Estos campos no existen en el modelo Proveedor, se ignoran
          break;
        default:
          // Log de campos no reconocidos para debugging
          console.log(`Campo no reconocido en proveedor: ${header}`);
          break;
      }
    });

    return proveedor;
  }

  private mapearFilaAMovimiento(row: any[], headers: string[], rowNumber: number) {
    const movimiento: any = {};
    
    headers.forEach((header, index) => {
      const value = row[index];
      const headerLower = header.toLowerCase().trim();
      
      switch (headerLower) {
        case 'producto':
        case 'productoid':
        case 'producto_id':
        case 'producto id':
        case 'id_producto':
        case 'idproducto':
        case 'productoId':
        case 'productoID':
        case 'ProductoId':
        case 'ProductoID':
          // Intentar parsear como número, si falla mantener como string para búsqueda posterior
          const productoId = parseInt(value);
          movimiento.productoId = isNaN(productoId) ? value : productoId;
          break;
        // ✅ NUEVO: Campo nombre de producto para creación automática
        case 'productonombre':
        case 'producto_nombre':
        case 'producto nombre':
        case 'nombre_producto':
        case 'nombreproducto':
        case 'producto_nom':
        case 'producto nom':
        case 'nom_producto':
        case 'nomproducto':
        case 'descripcion_producto':
        case 'descripcionproducto':
          movimiento.productoNombre = value;
          break;
        case 'tipo':
        case 'tipo_movimiento':
        case 'tipo movimiento':
        case 'operacion':
        case 'accion':
          // Normalizar el tipo de movimiento
          const tipoNormalizado = this.normalizarTipoMovimiento(value);
          movimiento.tipo = tipoNormalizado;
          break;
        case 'cantidad':
        case 'cant':
        case 'qty':
        case 'volumen':
        case 'unidades':
          movimiento.cantidad = parseInt(value) || 0;
          break;
        case 'motivo':
        case 'razon':
        case 'causa':
        case 'justificacion':
        case 'descripcion_motivo':
          movimiento.motivo = value;
          break;
        case 'descripcion':
        case 'desc':
        case 'comentario':
        case 'notas':
          movimiento.descripcion = value;
          break;
        // ✅ NUEVO: Campos de precio
        case 'preciounitar':
        case 'precio_unitar':
        case 'precio unitar':
        case 'preciounitario':
        case 'precio_unitario':
        case 'precio unitario':
        case 'precio_por_unidad':
        case 'precio por unidad':
        case 'unitario':
        case 'precio':
          movimiento.precioUnitario = parseFloat(value) || null;
          break;
        case 'preciototal':
        case 'precio_total':
        case 'precio total':
        case 'total':
        case 'valor_total':
        case 'valor total':
        case 'monto_total':
        case 'monto total':
          movimiento.precioTotal = parseFloat(value) || null;
          break;
        case 'tipoprecio':
        case 'tipo_precio':
        case 'tipo precio':
        case 'tipo_de_precio':
        case 'tipo de precio':
        case 'categoria_precio':
        case 'categoria precio':
          // Normalizar el tipo de precio
          if (value) {
            const tipoPrecioNormalizado = this.normalizarTipoPrecio(value);
            movimiento.tipoPrecio = tipoPrecioNormalizado;
          }
          break;
        // ✅ NUEVO: Campo proveedor
        case 'proveedor':
        case 'proveedorld':
        case 'proveedor_id':
        case 'proveedor id':
        case 'id_proveedor':
        case 'idproveedor':
        case 'proveedorid':
        case 'proveedorId':
        case 'proveedorID':
        case 'ProveedorId':
        case 'ProveedorID':
          // Intentar parsear como número, si falla mantener como string para búsqueda posterior
          const proveedorId = parseInt(value);
          movimiento.proveedorId = isNaN(proveedorId) ? value : proveedorId;
          break;
        // ✅ NUEVO: Campo nombre de proveedor para creación automática
        case 'proveedornombre':
        case 'proveedor_nombre':
        case 'proveedor nombre':
        case 'nombre_proveedor':
        case 'nombreproveedor':
        case 'proveedor_nom':
        case 'proveedor nom':
        case 'nom_proveedor':
        case 'nomproveedor':
          movimiento.proveedorNombre = value;
          break;
        case 'fecha':
        case 'fecha_movimiento':
        case 'fecha_transaccion':
        case 'fecha movimiento':
        case 'fecha transaccion':
        case 'dia':
        case 'fecha_creacion':
          // Parsear fecha si es string, si no usar la fecha actual
          if (value) {
            let fecha: Date;
            
            // Intentar diferentes formatos de fecha
            if (typeof value === 'string') {
              // Formato YYYY-MM-DD
              if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                fecha = new Date(value);
              }
              // Formato DD/MM/YYYY
              else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                const [day, month, year] = value.split('/');
                fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
              // Formato DD-MM-YYYY
              else if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
                const [day, month, year] = value.split('-');
                fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
              // Formato MM/DD/YYYY
              else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
                const [month, day, year] = value.split('/');
                fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
              // Formato ISO o timestamp
              else {
                fecha = new Date(value);
              }
              
              if (!isNaN(fecha.getTime())) {
                movimiento.fecha = fecha;
              }
            } else if (value instanceof Date) {
              movimiento.fecha = value;
            }
          }
          break;
        case 'empresa':
        case 'empresaid':
        case 'empresa_id':
        case 'empresa id':
        case 'id_empresa':
        case 'idempresa':
          // El empresaId se asignará automáticamente desde el usuario
          // No mapear este campo ya que viene del contexto del usuario
          break;
        case 'estado':
        case 'status':
        case 'estado_movimiento':
          // Normalizar estado si se proporciona
          if (value) {
            movimiento.estado = this.normalizarEstadoMovimiento(value);
          }
          break;
        // Ignorar campos que no existen en el modelo o se manejan automáticamente
        case 'usuario':
        case 'usuario_id':
        case 'user':
        case 'user_id':
        case 'id_usuario':
        case 'idusuario':
        case 'createdat':
        case 'created_at':
        case 'fecha_creacion':
        case 'fecha_creado':
        case 'created':
        case 'updatedat':
        case 'updated_at':
        case 'fecha_actualizacion':
        case 'updated':
        case 'id':
        case 'movimiento_id':
        case 'id_movimiento':
          // Estos campos se manejan automáticamente por Prisma o no son relevantes
          break;
        default:
          // Log de campos no reconocidos para debugging (solo en desarrollo)
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(`Campo no reconocido en movimiento: ${header} (valor: ${value})`);
          }
          break;
      }
    });

    // ✅ NUEVO: Mapeo posicional para archivos sin headers o headers no reconocidos
    // Si no se mapeó ningún campo importante, intentar mapeo posicional
    if (!movimiento.productoId && !movimiento.productoNombre && !movimiento.tipo && !movimiento.cantidad) {
      this.logger.debug(`Intentando mapeo posicional para fila ${rowNumber}`);
      
      // Mapeo posicional basado en la estructura típica de movimientos
      // [tipo, cantidad, productoNombre, precioUnitario, precioTotal, tipoPrecio, motivo, descripcion, fecha, proveedorNombre]
      if (row.length >= 3) {
        // Posición 0: tipo
        if (row[0]) {
          const tipoNormalizado = this.normalizarTipoMovimiento(row[0]);
          movimiento.tipo = tipoNormalizado;
        }
        
        // Posición 1: cantidad
        if (row[1]) {
          movimiento.cantidad = parseInt(row[1]) || 0;
        }
        
        // Posición 2: productoNombre
        if (row[2]) {
          movimiento.productoNombre = row[2];
        }
        
        // Posición 3: precioUnitario
        if (row[3]) {
          movimiento.precioUnitario = parseFloat(row[3]) || null;
        }
        
        // Posición 4: precioTotal
        if (row[4]) {
          movimiento.precioTotal = parseFloat(row[4]) || null;
        }
        
        // Posición 5: tipoPrecio
        if (row[5]) {
          const tipoPrecioNormalizado = this.normalizarTipoPrecio(row[5]);
          movimiento.tipoPrecio = tipoPrecioNormalizado;
        }
        
        // Posición 6: motivo
        if (row[6]) {
          movimiento.motivo = row[6];
        }
        
        // Posición 7: descripcion
        if (row[7]) {
          movimiento.descripcion = row[7];
        }
        
        // Posición 8: fecha
        if (row[8]) {
          let fecha: Date;
          if (typeof row[8] === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(row[8])) {
              fecha = new Date(row[8]);
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(row[8])) {
              const [day, month, year] = row[8].split('/');
              fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              fecha = new Date(row[8]);
            }
            if (!isNaN(fecha.getTime())) {
              movimiento.fecha = fecha;
            }
          }
        }
        
        // Posición 9: proveedorNombre
        if (row[9]) {
          movimiento.proveedorNombre = row[9];
        }
        
        this.logger.debug(`Mapeo posicional aplicado para fila ${rowNumber}: tipo=${movimiento.tipo}, cantidad=${movimiento.cantidad}, producto=${movimiento.productoNombre}`);
      }
    }

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
      return { 
        valido: false, 
        columna: 'nombre', 
        valor: data.nombre, 
        mensaje: 'Nombre es requerido',
        valorEsperado: 'Texto no vacío',
        sugerencia: 'Asegúrese de que el campo nombre tenga un valor'
      };
    }
    if (data.precioCompra === undefined || data.precioCompra === null) {
      return { 
        valido: false, 
        columna: 'precioCompra', 
        valor: data.precioCompra, 
        mensaje: 'Precio de compra es requerido',
        valorEsperado: 'Número mayor a 0',
        sugerencia: 'Ingrese un precio de compra válido'
      };
    }
    if (data.precioVenta === undefined || data.precioVenta === null) {
      return { 
        valido: false, 
        columna: 'precioVenta', 
        valor: data.precioVenta, 
        mensaje: 'Precio de venta es requerido',
        valorEsperado: 'Número mayor a 0',
        sugerencia: 'Ingrese un precio de venta válido'
      };
    }
    if (data.precioCompra < 0) {
      return { 
        valido: false, 
        columna: 'precioCompra', 
        valor: data.precioCompra, 
        mensaje: 'Precio de compra debe ser positivo',
        valorEsperado: 'Número mayor a 0',
        sugerencia: 'El precio de compra debe ser un valor positivo'
      };
    }
    if (data.precioVenta < 0) {
      return { 
        valido: false, 
        columna: 'precioVenta', 
        valor: data.precioVenta, 
        mensaje: 'Precio de venta debe ser positivo',
        valorEsperado: 'Número mayor a 0',
        sugerencia: 'El precio de venta debe ser un valor positivo'
      };
    }
    return { valido: true };
  }

  private validarProveedor(data: any) {
    if (!data.nombre) {
      return { 
        valido: false, 
        columna: 'nombre', 
        valor: data.nombre, 
        mensaje: 'Nombre es requerido',
        valorEsperado: 'Texto no vacío',
        sugerencia: 'Asegúrese de que el campo nombre tenga un valor'
      };
    }
    if (data.email && !this.isValidEmail(data.email)) {
      return { 
        valido: false, 
        columna: 'email', 
        valor: data.email, 
        mensaje: 'Email inválido',
        valorEsperado: 'Formato de email válido (ejemplo@dominio.com)',
        sugerencia: 'Verifique que el email tenga un formato válido'
      };
    }
    return { valido: true };
  }

  private validarMovimiento(data: any) {
    if (!data.productoId && !data.productoNombre) {
      return { 
        valido: false, 
        columna: 'producto', 
        valor: data.productoId || data.productoNombre, 
        mensaje: 'Producto es requerido',
        valorEsperado: 'ID de producto válido o nombre de producto',
        sugerencia: 'Asegúrese de que el campo producto tenga un valor válido'
      };
    }
    
    if (!data.tipo || !['ENTRADA', 'SALIDA'].includes(data.tipo)) {
      return { 
        valido: false, 
        columna: 'tipo', 
        valor: data.tipo, 
        mensaje: 'Tipo debe ser ENTRADA o SALIDA',
        valorEsperado: 'ENTRADA o SALIDA',
        sugerencia: 'El tipo de movimiento debe ser "ENTRADA" o "SALIDA"'
      };
    }
    
    if (!data.cantidad || data.cantidad <= 0) {
      return { 
        valido: false, 
        columna: 'cantidad', 
        valor: data.cantidad, 
        mensaje: 'Cantidad debe ser positiva',
        valorEsperado: 'Número mayor a 0',
        sugerencia: 'La cantidad debe ser un número positivo mayor a 0'
      };
    }

    // Validar que la cantidad sea un número entero
    if (!Number.isInteger(data.cantidad)) {
      return {
        valido: false,
        columna: 'cantidad',
        valor: data.cantidad,
        mensaje: 'Cantidad debe ser un número entero',
        valorEsperado: 'Número entero mayor a 0',
        sugerencia: 'La cantidad debe ser un número entero sin decimales'
      };
    }

    // Validar fecha si se proporciona
    if (data.fecha) {
      const fecha = new Date(data.fecha);
      if (isNaN(fecha.getTime())) {
        return {
          valido: false,
          columna: 'fecha',
          valor: data.fecha,
          mensaje: 'Fecha inválida',
          valorEsperado: 'Fecha válida en formato YYYY-MM-DD o DD/MM/YYYY',
          sugerencia: 'Use un formato de fecha válido como 2024-01-15 o 15/01/2024'
        };
      }

      // Validar que la fecha no sea futura (permitir hasta mañana para ajustes de zona horaria)
      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(hoy.getDate() + 1);
      
      if (fecha > mañana) {
        return {
          valido: false,
          columna: 'fecha',
          valor: data.fecha,
          mensaje: 'La fecha no puede ser futura',
          valorEsperado: 'Fecha actual o pasada',
          sugerencia: 'Use una fecha actual o pasada para el movimiento'
        };
      }
    }

    // ✅ NUEVO: Validaciones para campos de precio
    if (data.precioUnitario !== undefined && data.precioUnitario !== null) {
      if (typeof data.precioUnitario !== 'number' || data.precioUnitario < 0) {
        return {
          valido: false,
          columna: 'precioUnitario',
          valor: data.precioUnitario,
          mensaje: 'Precio unitario debe ser un número positivo',
          valorEsperado: 'Número mayor o igual a 0',
          sugerencia: 'El precio unitario debe ser un número positivo o 0'
        };
      }
    }

    if (data.precioTotal !== undefined && data.precioTotal !== null) {
      if (typeof data.precioTotal !== 'number' || data.precioTotal < 0) {
        return {
          valido: false,
          columna: 'precioTotal',
          valor: data.precioTotal,
          mensaje: 'Precio total debe ser un número positivo',
          valorEsperado: 'Número mayor o igual a 0',
          sugerencia: 'El precio total debe ser un número positivo o 0'
        };
      }
    }

    if (data.tipoPrecio && !['COMPRA', 'VENTA', 'AJUSTE', 'TRANSFERENCIA'].includes(data.tipoPrecio)) {
      return {
        valido: false,
        columna: 'tipoPrecio',
        valor: data.tipoPrecio,
        mensaje: 'Tipo de precio debe ser COMPRA, VENTA, AJUSTE o TRANSFERENCIA',
        valorEsperado: 'COMPRA, VENTA, AJUSTE o TRANSFERENCIA',
        sugerencia: 'Use uno de los valores válidos para el tipo de precio'
      };
    }

    // ✅ NUEVO: Validar coherencia entre precioUnitario, precioTotal y cantidad
    if (data.precioUnitario && data.precioTotal && data.cantidad) {
      const precioCalculado = data.precioUnitario * data.cantidad;
      const diferencia = Math.abs(precioCalculado - data.precioTotal);
      
      // Permitir pequeñas diferencias por redondeo (máximo 0.01)
      if (diferencia > 0.01) {
        return {
          valido: false,
          columna: 'precioTotal',
          valor: data.precioTotal,
          mensaje: 'El precio total no coincide con el precio unitario por la cantidad',
          valorEsperado: `Aproximadamente ${precioCalculado.toFixed(2)}`,
          sugerencia: 'Verifique que precioTotal = precioUnitario × cantidad'
        };
      }
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

  // Métodos auxiliares para manejo de duplicados y errores
  private async verificarDuplicadosProducto(productoData: any, empresaId: number): Promise<string[]> {
    const duplicados: string[] = [];
    
    // Verificar por nombre en la misma empresa
    if (productoData.nombre) {
      const existentePorNombre = await this.prisma.producto.findFirst({
        where: {
          nombre: productoData.nombre,
          empresaId: empresaId
        }
      });
      if (existentePorNombre) {
        duplicados.push(`nombre: "${productoData.nombre}"`);
      }
    }

    // Verificar por código de barras (único global)
    if (productoData.codigoBarras) {
      const existentePorCodigo = await this.prisma.producto.findFirst({
        where: { codigoBarras: productoData.codigoBarras }
      });
      if (existentePorCodigo) {
        duplicados.push(`código de barras: "${productoData.codigoBarras}"`);
      }
    }

    // Verificar por SKU (único global)
    if (productoData.sku) {
      const existentePorSku = await this.prisma.producto.findFirst({
        where: { sku: productoData.sku }
      });
      if (existentePorSku) {
        duplicados.push(`SKU: "${productoData.sku}"`);
      }
    }

    // Verificar por RFID (único global)
    if (productoData.rfid) {
      const existentePorRfid = await this.prisma.producto.findFirst({
        where: { rfid: productoData.rfid }
      });
      if (existentePorRfid) {
        duplicados.push(`RFID: "${productoData.rfid}"`);
      }
    }

    return duplicados;
  }

  private async verificarDuplicadosProveedor(proveedorData: any, empresaId: number): Promise<string[]> {
    const duplicados: string[] = [];
    
    // Verificar por nombre en la misma empresa
    if (proveedorData.nombre) {
      const existentePorNombre = await this.prisma.proveedor.findFirst({
        where: {
          nombre: proveedorData.nombre,
          empresaId: empresaId
        }
      });
      if (existentePorNombre) {
        duplicados.push(`nombre: "${proveedorData.nombre}"`);
      }
    }

    // Verificar por email en la misma empresa
    if (proveedorData.email) {
      const existentePorEmail = await this.prisma.proveedor.findFirst({
        where: {
          email: proveedorData.email,
          empresaId: empresaId
        }
      });
      if (existentePorEmail) {
        duplicados.push(`email: "${proveedorData.email}"`);
      }
    }

    return duplicados;
  }

  private interpretarErrorPrisma(error: any, data: any): string {
    if (error.code === 'P2002') {
      // Error de unicidad
      const field = error.meta?.target?.[0];
      if (field) {
        return `Campo "${field}" ya existe en la base de datos`;
      }
      return 'Registro duplicado detectado';
    }
    
    if (error.code === 'P2003') {
      // Error de clave foránea
      return 'Referencia a registro inexistente';
    }
    
    if (error.code === 'P2025') {
      // Registro no encontrado
      return 'Registro no encontrado';
    }

    // Error de campo desconocido (como usuarioId)
    if (error.message && error.message.includes('Unknown argument')) {
      const match = error.message.match(/Unknown argument `([^`]+)`/);
      if (match) {
        const campoDesconocido = match[1];
        return `Campo "${campoDesconocido}" no existe en el modelo de base de datos`;
      }
      return 'Campo desconocido en el modelo de base de datos';
    }

    // Error genérico
    return error.message || 'Error desconocido en la base de datos';
  }

  private obtenerSugerenciaError(error: any): string {
    if (error.code === 'P2002') {
      return 'Verificar si el registro ya existe y considerar actualizarlo en lugar de crear uno nuevo';
    }
    
    if (error.code === 'P2003') {
      return 'Verificar que las referencias (proveedor, categoría, etc.) existan en la base de datos';
    }

    // Error de campo desconocido
    if (error.message && error.message.includes('Unknown argument')) {
      return 'Verificar que los nombres de las columnas en el archivo coincidan con los campos válidos del modelo';
    }
    
    return 'Revisar los datos ingresados y verificar que cumplan con los requisitos del sistema';
  }

  // Métodos de normalización inteligente
  private normalizarPrecio(valor: string): string {
    if (!valor) return '0';
    
    // Remover símbolos de moneda y espacios
    let normalizado = valor.toString().replace(/[^\d.,]/g, '');
    
    // Convertir coma a punto si es necesario
    if (normalizado.includes(',') && !normalizado.includes('.')) {
      normalizado = normalizado.replace(',', '.');
    }
    
    // Si hay múltiples puntos, mantener solo el último (decimal)
    const partes = normalizado.split('.');
    if (partes.length > 2) {
      const enteros = partes.slice(0, -1).join('');
      const decimales = partes[partes.length - 1];
      normalizado = `${enteros}.${decimales}`;
    }
    
    return normalizado || '0';
  }

  private normalizarNumero(valor: string): string {
    if (!valor) return '0';
    
    // Remover caracteres no numéricos excepto punto y coma
    let normalizado = valor.toString().replace(/[^\d.,]/g, '');
    
    // Convertir coma a punto si es necesario
    if (normalizado.includes(',') && !normalizado.includes('.')) {
      normalizado = normalizado.replace(',', '.');
    }
    
    return normalizado || '0';
  }

  private normalizarCodigoBarras(valor: string): string {
    if (!valor) return '';
    
    // Remover espacios y caracteres especiales
    let normalizado = valor.toString().replace(/[^\d]/g, '');
    
    // Validar longitud típica de códigos de barras
    if (normalizado.length >= 8 && normalizado.length <= 13) {
      return normalizado;
    }
    
    return valor.toString().trim();
  }

  private normalizarSKU(valor: string): string {
    if (!valor) return '';
    
    // Convertir a mayúsculas y remover espacios extra
    let normalizado = valor.toString().toUpperCase().trim();
    
    // Remover caracteres especiales problemáticos
    normalizado = normalizado.replace(/[^\w\-]/g, '');
    
    return normalizado;
  }

  private normalizarRFID(valor: string): string {
    if (!valor) return '';
    
    // Convertir a mayúsculas y remover espacios
    let normalizado = valor.toString().toUpperCase().trim();
    
    // Asegurar formato RFID-XXXXX
    if (!normalizado.startsWith('RFID-')) {
      normalizado = `RFID-${normalizado}`;
    }
    
    return normalizado;
  }

  private normalizarTipoProducto(valor: string): string {
    if (!valor) return 'GENERICO';
    
    const valorUpper = valor.toString().toUpperCase().trim();
    
    // Mapeo de tipos comunes
    const mapeoTipos: Record<string, string> = {
      'ELECTRONICO': 'ELECTRONICO',
      'ELECTRÓNICO': 'ELECTRONICO',
      'ELECTRONICOS': 'ELECTRONICO',
      'ELECTRÓNICOS': 'ELECTRONICO',
      'MEDICAMENTO': 'MEDICAMENTO',
      'MEDICAMENTOS': 'MEDICAMENTO',
      'ALIMENTO': 'ALIMENTO',
      'ALIMENTOS': 'ALIMENTO',
      'ROPA': 'ROPA',
      'HERRAMIENTA': 'HERRAMIENTA',
      'HERRAMIENTAS': 'HERRAMIENTA',
      'EQUIPO': 'EQUIPO',
      'EQUIPOS': 'EQUIPO',
      'MAQUINARIA': 'MAQUINARIA',
      'REPUESTO': 'REPUESTO',
      'REPUESTOS': 'REPUESTO',
      'ACCESORIO': 'ACCESORIO',
      'ACCESORIOS': 'ACCESORIO',
      'CONSUMIBLE': 'CONSUMIBLE',
      'CONSUMIBLES': 'CONSUMIBLE',
      'MATERIAL': 'MATERIAL',
      'MATERIALES': 'MATERIAL',
      'GENERICO': 'GENERICO',
      'GENÉRICO': 'GENERICO',
    };
    
    return mapeoTipos[valorUpper] || 'GENERICO';
  }

  private normalizarUnidadMedida(valor: string): string {
    if (!valor) return 'UNIDAD';
    
    const valorUpper = valor.toString().toUpperCase().trim();
    
    // Mapeo de unidades comunes
    const mapeoUnidades: Record<string, string> = {
      'UNIDAD': 'UNIDAD',
      'UNIDADES': 'UNIDAD',
      'KILOGRAMO': 'KILOGRAMO',
      'KG': 'KILOGRAMO',
      'LITRO': 'LITRO',
      'L': 'LITRO',
      'METRO': 'METRO',
      'M': 'METRO',
      'GRAMO': 'GRAMO',
      'G': 'GRAMO',
      'MILILITRO': 'MILILITRO',
      'ML': 'MILILITRO',
      'CENTIMETRO': 'CENTIMETRO',
      'CM': 'CENTIMETRO',
      'CAJA': 'CAJA',
      'PAQUETE': 'PAQUETE',
      'LICENCIA': 'LICENCIA',
    };
    
    return mapeoUnidades[valorUpper] || 'UNIDAD';
  }

  private normalizarEstado(valor: string): string {
    if (!valor) return 'ACTIVO';
    
    const valorUpper = valor.toString().toUpperCase().trim();
    
    // Mapeo de estados
    const mapeoEstados: Record<string, string> = {
      'ACTIVO': 'ACTIVO',
      'INACTIVO': 'INACTIVO',
      'DISPONIBLE': 'ACTIVO',
      'AGOTADO': 'INACTIVO',
      'PENDIENTE': 'ACTIVO',
      'COMPLETADO': 'ACTIVO',
      'CANCELADO': 'INACTIVO',
    };
    
    return mapeoEstados[valorUpper] || 'ACTIVO';
  }

  private normalizarEtiquetas(valor: string): string[] {
    if (!valor) return [];
    
    // Dividir por comas, puntos y comas, o saltos de línea
    const etiquetas = valor.toString().split(/[,;\n]/);
    
    // Limpiar y normalizar cada etiqueta
    return etiquetas
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
  }

  private normalizarTipoMovimiento(valor: string): string {
    if (!valor) return 'ENTRADA';
    
    const valorUpper = valor.toString().toUpperCase().trim();
    
    // Mapeo de tipos de movimiento
    const mapeoTipos: Record<string, string> = {
      'ENTRADA': 'ENTRADA',
      'SALIDA': 'SALIDA',
      'IN': 'ENTRADA',
      'OUT': 'SALIDA',
      'COMPRA': 'ENTRADA',
      'VENTA': 'SALIDA',
      'RECEPCION': 'ENTRADA',
      'DESPACHO': 'SALIDA',
      'INGRESO': 'ENTRADA',
      'EGRESO': 'SALIDA',
      'ADICION': 'ENTRADA',
      'REDUCCION': 'SALIDA',
    };
    
    return mapeoTipos[valorUpper] || 'ENTRADA';
  }

  private normalizarEstadoMovimiento(valor: string): string {
    if (!valor) return 'ACTIVO';
    
    const valorUpper = valor.toString().toUpperCase().trim();
    
    // Mapeo de estados de movimiento
    const mapeoEstados: Record<string, string> = {
      'ACTIVO': 'ACTIVO',
      'ELIMINADO': 'ELIMINADO',
      'PENDIENTE': 'ACTIVO',
      'COMPLETADO': 'ACTIVO',
      'CANCELADO': 'ELIMINADO',
      'ANULADO': 'ELIMINADO',
    };
    
    return mapeoEstados[valorUpper] || 'ACTIVO';
  }

  // ✅ NUEVO: Método para normalizar tipos de precio
  private normalizarTipoPrecio(valor: string): string {
    if (!valor) return 'COMPRA';
    
    const valorUpper = valor.toString().toUpperCase().trim();
    
    // Mapeo de tipos de precio
    const mapeoTiposPrecio: Record<string, string> = {
      'COMPRA': 'COMPRA',
      'VENTA': 'VENTA',
      'AJUSTE': 'AJUSTE',
      'TRANSFERENCIA': 'TRANSFERENCIA',
      'PURCHASE': 'COMPRA',
      'SALE': 'VENTA',
      'ADJUSTMENT': 'AJUSTE',
      'TRANSFER': 'TRANSFERENCIA',
      'BUY': 'COMPRA',
      'SELL': 'VENTA',
      'ADJUST': 'AJUSTE',
      'MOVE': 'TRANSFERENCIA',
    };
    
    return mapeoTiposPrecio[valorUpper] || 'COMPRA';
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

  // ✅ NUEVO: Método para normalizar nombres de proveedores
  private normalizarNombreProveedor(nombre: string): string {
    if (!nombre) return '';

    // Convertir a minúsculas y remover acentos
    let normalizado = nombre.toLowerCase();
    normalizado = normalizado.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Eliminar diacríticos

    // Reemplazar caracteres especiales por un espacio
    normalizado = normalizado.replace(/[^a-z0-9\s]/g, ' ');

    // Quitar múltiples espacios
    normalizado = normalizado.replace(/\s+/g, ' ');

    // Limpiar espacios al inicio y final
    normalizado = normalizado.trim();

    return normalizado;
  }
} 