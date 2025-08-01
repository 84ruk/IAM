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

        // Resolver productoId - verificar si existe el producto
        let productoIdFinal = movimientoData.productoId;
        let productoEncontrado = false;
        let productoNombre = '';
        let productoCreado = false;

        try {
          // Usar el servicio de creación de productos para buscar o crear automáticamente
          const resultadoProducto = await this.productoCreator.buscarOCrearProducto(
            movimientoData.productoId,
            {
              empresaId: user.empresaId,
              etiquetas: ['AUTO-CREADO', 'IMPORTACION-MOVIMIENTOS'],
              stockInicial: 0,
              precioCompra: 0,
              precioVenta: 0,
              stockMinimo: 10
            }
          );

          productoIdFinal = resultadoProducto.producto.id;
          productoEncontrado = true;
          productoNombre = resultadoProducto.producto.nombre;
          productoCreado = resultadoProducto.creado;

          if (productoCreado) {
            this.logger.log(`✅ Producto creado automáticamente: "${movimientoData.productoId}" -> ID: ${productoIdFinal}`);
          } else {
            this.logger.debug(`Producto encontrado: "${movimientoData.productoId}" -> ID: ${productoIdFinal}`);
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

        // Crear el movimiento con el productoId resuelto
        const movimientoGuardado = await this.prisma.movimientoInventario.create({
          data: {
            ...movimientoData,
            productoId: productoIdFinal,
            empresaId: user.empresaId,
            // usuarioId no existe en el modelo MovimientoInventario, solo empresaId
          },
        });

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
            productoCreado: productoCreado
          },
          identificador: `${movimientoGuardado.tipo} - ${productoNombre} (${movimientoGuardado.cantidad})${productoCreado ? ' [Producto creado]' : ''}`,
          timestamp: new Date()
        });

        registrosExitosos++;
        
        // Log individual de cada registro exitoso
        const logMessage = productoCreado 
          ? `✅ Movimiento importado exitosamente - Fila ${rowNumber}: ${movimientoGuardado.tipo} de ${movimientoGuardado.cantidad} unidades de "${productoNombre}" (ID: ${movimientoGuardado.id}) [Producto creado automáticamente]`
          : `✅ Movimiento importado exitosamente - Fila ${rowNumber}: ${movimientoGuardado.tipo} de ${movimientoGuardado.cantidad} unidades de "${productoNombre}" (ID: ${movimientoGuardado.id})`;
        
        this.logger.log(logMessage);
        
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
          // Intentar parsear como número, si falla mantener como string para búsqueda posterior
          const productoId = parseInt(value);
          movimiento.productoId = isNaN(productoId) ? value : productoId;
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
        case 'fecha':
        case 'fecha_movimiento':
        case 'fecha_transaccion':
        case 'fecha movimiento':
        case 'fecha transaccion':
        case 'dia':
        case 'fecha_creacion':
          // Parsear fecha si es string, si no usar la fecha actual
          if (value) {
            const fecha = new Date(value);
            if (!isNaN(fecha.getTime())) {
              movimiento.fecha = fecha;
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
    if (!data.productoId) {
      return { 
        valido: false, 
        columna: 'producto', 
        valor: data.productoId, 
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
    if (data.cantidad <= 0) {
      return { 
        valido: false, 
        columna: 'cantidad', 
        valor: data.cantidad, 
        mensaje: 'Cantidad debe ser positiva',
        valorEsperado: 'Número mayor a 0',
        sugerencia: 'La cantidad debe ser un número positivo mayor a 0'
      };
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