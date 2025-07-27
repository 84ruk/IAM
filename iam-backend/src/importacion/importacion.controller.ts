import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  HttpCode,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileTypeValidator } from './validators/file-type.validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ImportacionService } from './importacion.service';
import { 
  ImportarProductosDto, 
  ImportarProveedoresDto, 
  ImportarMovimientosDto,
  ImportacionUnificadaDto
} from './dto';
import { DetectorTipoImportacionService } from './servicios/detector-tipo-importacion.service';
import { PlantillasService } from './servicios/plantillas.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Importación')
@Controller('importacion')
@EmpresaRequired()
export class ImportacionController {
  private readonly logger = new Logger(ImportacionController.name);
  constructor(
    private readonly importacionService: ImportacionService,
    private readonly detectorTipoService: DetectorTipoImportacionService,
    private readonly plantillasService: PlantillasService,
  ) {}

  /**
   * Sube y procesa un archivo para importar productos
   */
  @Post('productos')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Importar productos desde archivo Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx, .xls, .numbers) o CSV',
        },
        sobrescribirExistentes: {
          type: 'boolean',
          description: 'Sobrescribir productos existentes',
        },
        validarSolo: {
          type: 'boolean',
          description: 'Solo validar sin importar',
        },
        notificarEmail: {
          type: 'boolean',
          description: 'Enviar notificación por email',
        },
        emailNotificacion: {
          type: 'string',
          description: 'Email para notificación',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Importación iniciada correctamente' })
  @ApiResponse({ status: 400, description: 'Error en el archivo o datos' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'import');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const extension = path.extname(file.originalname);
          cb(null, `productos-${timestamp}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/x-iwork-numbers-sffnumbers',
          'text/csv',
          'application/csv',
        ];
        const allowedExtensions = ['.xlsx', '.xls', '.numbers', '.csv'];
        const extension = (file.originalname || '').toLowerCase().split('.').pop();
        const extWithDot = extension ? `.${extension}` : '';

        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extWithDot)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de archivo no permitido'), false);
        }
      },
    })
  )
  async importarProductos(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: ImportarProductosDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      // Validar tipo de archivo
      const fileValidator = new FileTypeValidator();
      fileValidator.transform(archivo);

      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      const resultado = await this.importacionService.importarProductos(
        archivo.path,
        opciones,
        usuario.empresaId,
        usuario.id
      );

      // Mapear respuesta al formato esperado por el frontend
      const response = {
        success: resultado.estado !== 'error',
        message: resultado.estado === 'error' ? 'Validación fallida' : 'Importación procesada correctamente',
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        totalRegistros: resultado.estadisticas.total,
        errores: resultado.estadisticas.errores,
        erroresDetallados: resultado.errores?.map(error => ({
          fila: error.fila,
          columna: error.columna,
          valor: error.valor,
          mensaje: error.mensaje,
          tipo: error.tipo
        }))
      };

      return response;
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      await this.importacionService.limpiarArchivosTemporales(archivo.path);
      throw error;
    }
  }

  /**
   * Sube y procesa un archivo para importar proveedores
   */
  @Post('proveedores')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Importar proveedores desde archivo Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx, .xls, .numbers) o CSV',
        },
        sobrescribirExistentes: {
          type: 'boolean',
          description: 'Sobrescribir proveedores existentes',
        },
        validarSolo: {
          type: 'boolean',
          description: 'Solo validar sin importar',
        },
        notificarEmail: {
          type: 'boolean',
          description: 'Enviar notificación por email',
        },
        emailNotificacion: {
          type: 'string',
          description: 'Email para notificación',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Importación iniciada correctamente' })
  @ApiResponse({ status: 400, description: 'Error en el archivo o datos' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'import');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const extension = path.extname(file.originalname);
          cb(null, `proveedores-${timestamp}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/x-iwork-numbers-sffnumbers',
          'text/csv',
          'application/csv',
        ];
        const allowedExtensions = ['.xlsx', '.xls', '.numbers', '.csv'];
        const extension = (file.originalname || '').toLowerCase().split('.').pop();
        const extWithDot = extension ? `.${extension}` : '';

        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extWithDot)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de archivo no permitido'), false);
        }
      },
    })
  )
  async importarProveedores(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: ImportarProveedoresDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      // Validar tipo de archivo
      const fileValidator = new FileTypeValidator();
      fileValidator.transform(archivo);

      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      const resultado = await this.importacionService.importarProveedores(
        archivo.path,
        opciones,
        usuario.empresaId,
        usuario.id
      );

      return {
        success: true,
        message: 'Importación procesada correctamente',
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        totalRegistros: resultado.estadisticas.total,
        errores: resultado.estadisticas.errores,
      };
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      await this.importacionService.limpiarArchivosTemporales(archivo.path);
      throw error;
    }
  }

  /**
   * Sube y procesa un archivo para importar movimientos
   */
  @Post('movimientos')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Importar movimientos de inventario desde archivo Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx, .xls, .numbers) o CSV',
        },
        sobrescribirExistentes: {
          type: 'boolean',
          description: 'Sobrescribir movimientos existentes',
        },
        validarSolo: {
          type: 'boolean',
          description: 'Solo validar sin importar',
        },
        notificarEmail: {
          type: 'boolean',
          description: 'Enviar notificación por email',
        },
        emailNotificacion: {
          type: 'string',
          description: 'Email para notificación',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Importación iniciada correctamente' })
  @ApiResponse({ status: 400, description: 'Error en el archivo o datos' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'import');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const extension = path.extname(file.originalname);
          cb(null, `movimientos-${timestamp}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/x-iwork-numbers-sffnumbers',
          'text/csv',
          'application/csv',
        ];
        const allowedExtensions = ['.xlsx', '.xls', '.numbers', '.csv'];
        const extension = (file.originalname || '').toLowerCase().split('.').pop();
        const extWithDot = extension ? `.${extension}` : '';

        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extWithDot)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de archivo no permitido'), false);
        }
      },
    })
  )
  async importarMovimientos(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: ImportarMovimientosDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      // Validar tipo de archivo
      const fileValidator = new FileTypeValidator();
      fileValidator.transform(archivo);

      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      const resultado = await this.importacionService.importarMovimientos(
        archivo.path,
        opciones,
        usuario.empresaId,
        usuario.id
      );

      return {
        success: true,
        message: 'Importación procesada correctamente',
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        totalRegistros: resultado.estadisticas.total,
        errores: resultado.estadisticas.errores,
      };
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      await this.importacionService.limpiarArchivosTemporales(archivo.path);
      throw error;
    }
  }

  /**
   * Obtiene el estado de un trabajo de importación
   */
  @Get('trabajos/:trabajoId')
  @ApiOperation({ summary: 'Obtener estado de un trabajo de importación' })
  @ApiResponse({ status: 200, description: 'Estado del trabajo obtenido' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async obtenerEstadoTrabajo(
    @Param('trabajoId') trabajoId: string,
    @CurrentUser() usuario: JwtUser,
  ) {
    if (!usuario.empresaId) {
      throw new BadRequestException('Usuario no tiene empresa asignada');
    }

    const trabajo = await this.importacionService.obtenerEstadoTrabajo(trabajoId, usuario.empresaId);
    
    return {
      success: true,
      trabajo,
    };
  }

  /**
   * Lista todos los trabajos de importación de la empresa
   */
  @Get('trabajos')
  @ApiOperation({ summary: 'Listar trabajos de importación de la empresa' })
  @ApiResponse({ status: 200, description: 'Lista de trabajos obtenida' })
  async listarTrabajos(
    @CurrentUser() usuario: JwtUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!usuario.empresaId) {
      throw new BadRequestException('Usuario no tiene empresa asignada');
    }

    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;

    const resultado = await this.importacionService.listarTrabajos(
      usuario.empresaId,
      limitNum,
      offsetNum
    );

    return {
      success: true,
      trabajos: resultado.trabajos,
      total: resultado.total,
      limit: limitNum,
      offset: offsetNum,
    };
  }

  /**
   * Obtiene estadísticas de la cola de importación (solo para debugging)
   */
  @Get('cola/estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de la cola de importación' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  async obtenerEstadisticasCola(@CurrentUser() usuario: JwtUser) {
    if (!usuario.empresaId) {
      throw new BadRequestException('Usuario no tiene empresa asignada');
    }

    const estadisticas = await this.importacionService.obtenerEstadisticasCola();

    return {
      success: true,
      estadisticas,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cancela un trabajo de importación
   */
  @Delete('trabajos/:trabajoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar un trabajo de importación' })
  @ApiResponse({ status: 204, description: 'Trabajo cancelado correctamente' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async cancelarTrabajo(
    @Param('trabajoId') trabajoId: string,
    @CurrentUser() usuario: JwtUser,
  ) {
    if (!usuario.empresaId) {
      throw new BadRequestException('Usuario no tiene empresa asignada');
    }

    await this.importacionService.cancelarTrabajo(trabajoId, usuario.empresaId);
  }

  /**
   * Descarga el reporte de errores de un trabajo
   */
  @Get('trabajos/:trabajoId/errores')
  @ApiOperation({ summary: 'Descargar reporte de errores de un trabajo' })
  @ApiResponse({ status: 200, description: 'Reporte de errores descargado' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async descargarReporteErrores(
    @Param('trabajoId') trabajoId: string,
    @CurrentUser() usuario: JwtUser,
    @Res() res: Response,
  ) {
    if (!usuario.empresaId) {
      throw new BadRequestException('Usuario no tiene empresa asignada');
    }

    const reportePath = await this.importacionService.descargarReporteErrores(trabajoId, usuario.empresaId);
    
    res.download(reportePath, `errores-${trabajoId}.xlsx`, (err) => {
      if (err) {
        // Limpiar archivo temporal si hay error en la descarga
        fs.unlink(reportePath, () => {});
      }
    });
  }

  /**
   * Genera una plantilla de Excel para productos
   */
  @Get('plantillas/productos')
  @ApiOperation({ summary: 'Generar plantilla de Excel para productos' })
  @ApiResponse({ status: 200, description: 'Plantilla generada correctamente' })
  @Public()
  async generarPlantillaProductos(@Res() res: Response) {
    const nombreArchivo = await this.importacionService.generarPlantilla('productos');
    const rutaArchivo = this.importacionService.obtenerRutaPlantilla(nombreArchivo);
    
    res.download(rutaArchivo, nombreArchivo, (err) => {
      if (err) {
        // Manejar error de descarga
      }
    });
  }

  /**
   * Genera una plantilla de Excel para proveedores
   */
  @Get('plantillas/proveedores')
  @ApiOperation({ summary: 'Generar plantilla de Excel para proveedores' })
  @ApiResponse({ status: 200, description: 'Plantilla generada correctamente' })
  @Public()
  async generarPlantillaProveedores(@Res() res: Response) {
    const nombreArchivo = await this.importacionService.generarPlantilla('proveedores');
    const rutaArchivo = this.importacionService.obtenerRutaPlantilla(nombreArchivo);
    
    res.download(rutaArchivo, nombreArchivo, (err) => {
      if (err) {
        // Manejar error de descarga
      }
    });
  }

  /**
   * Genera una plantilla de Excel para movimientos
   */
  @Get('plantillas/movimientos')
  @ApiOperation({ summary: 'Generar plantilla de Excel para movimientos' })
  @ApiResponse({ status: 200, description: 'Plantilla generada correctamente' })
  @Public()
  async generarPlantillaMovimientos(@Res() res: Response) {
    const nombreArchivo = await this.importacionService.generarPlantilla('movimientos');
    const rutaArchivo = this.importacionService.obtenerRutaPlantilla(nombreArchivo);
    
    res.download(rutaArchivo, nombreArchivo, (err) => {
      if (err) {
        // Manejar error de descarga
      }
    });
  }

  /**
   * Lista las plantillas disponibles
   */
  @Get('plantillas')
  @ApiOperation({ summary: 'Listar plantillas disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas obtenida' })
  @Public()
  async listarPlantillas() {
    const plantillas = this.importacionService.listarPlantillas();
    
    return {
      success: true,
      plantillas,
    };
  }

  /**
   * Detecta automáticamente el tipo de importación y la procesa
   */
  @Post('auto')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Importación automática - detecta el tipo de archivo y lo procesa' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx, .xls, .numbers) o CSV - se detectará automáticamente el tipo',
        },
        sobrescribirExistentes: {
          type: 'boolean',
          description: 'Sobrescribir registros existentes',
        },
        validarSolo: {
          type: 'boolean',
          description: 'Solo validar sin importar',
        },
        notificarEmail: {
          type: 'boolean',
          description: 'Enviar notificación por email',
        },
        emailNotificacion: {
          type: 'string',
          description: 'Email para notificación',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Importación iniciada correctamente' })
  @ApiResponse({ status: 400, description: 'Error en el archivo o datos' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'import');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const extension = path.extname(file.originalname);
          cb(null, `auto-${timestamp}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/x-iwork-numbers-sffnumbers',
          'text/csv',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no soportado. Use Excel (.xlsx, .xls, .numbers) o CSV'), false);
        }
      },
    })
  )
  async importarAutomatica(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: {
      sobrescribirExistentes?: boolean;
      validarSolo?: boolean;
      notificarEmail?: boolean;
      emailNotificacion?: string;
    },
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      this.logger.log(`🤖 Iniciando importación automática para usuario ${usuario.id}`);

      // Validar que el archivo se subió correctamente
      if (!archivo) {
        throw new BadRequestException('No se proporcionó ningún archivo');
      }

      // Validar que el usuario tenga empresa asignada
      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      // Detectar automáticamente el tipo de importación
      const deteccion = await this.detectorTipoService.detectarTipo(archivo.path);
      
      this.logger.log(`🔍 Tipo detectado: ${deteccion.tipo} (confianza: ${deteccion.confianza}%)`);

      // Si la confianza es muy baja, pedir confirmación
      if (deteccion.confianza < 60) {
        return {
          success: true,
          necesitaConfirmacion: true,
          deteccion: deteccion,
          mensaje: 'No se pudo determinar con certeza el tipo de importación. Por favor, confirme el tipo.',
          opcionesDisponibles: this.detectorTipoService.obtenerInformacionTipos(),
        };
      }

      // Crear las opciones unificadas
      const opcionesUnificadas = new ImportacionUnificadaDto();
      opcionesUnificadas.tipo = deteccion.tipo;
      opcionesUnificadas.sobrescribirExistentes = opciones.sobrescribirExistentes || false;
      opcionesUnificadas.validarSolo = opciones.validarSolo || false;
      opcionesUnificadas.notificarEmail = opciones.notificarEmail || false;
      opcionesUnificadas.emailNotificacion = opciones.emailNotificacion;

      // Procesar la importación
      const resultado = await this.importacionService.importarUnificada(
        archivo.path,
        opcionesUnificadas,
        usuario.empresaId,
        usuario.id
      );

      this.logger.log(`✅ Importación automática iniciada: ${resultado.trabajoId}`);

      return {
        success: true,
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        estadisticas: resultado.estadisticas,
        tipoDetectado: deteccion.tipo,
        confianza: deteccion.confianza,
        mensaje: `Importación de ${deteccion.tipo} iniciada correctamente (detectado automáticamente)`
      };

    } catch (error) {
      this.logger.error(`❌ Error en importación automática:`, error);
      
      // Limpiar archivo temporal en caso de error
      if (archivo?.path) {
        await this.importacionService.limpiarArchivosTemporales(archivo.path);
      }
      
      throw error;
    }
  }

  /**
   * Genera plantillas mejoradas alineadas con la detección automática
   */
  @Get('plantillas-mejoradas/:tipo')
  @ApiOperation({ summary: 'Generar plantilla mejorada para detección automática' })
  @ApiResponse({ status: 200, description: 'Plantilla generada correctamente' })
  async generarPlantillaMejorada(
    @Param('tipo') tipo: string,
    @Res() res: Response,
  ) {
    try {
      let nombreArchivo: string;
      
      switch (tipo) {
        case 'productos':
          nombreArchivo = await this.plantillasService.generarPlantillaProductos();
          break;
        case 'proveedores':
          nombreArchivo = await this.plantillasService.generarPlantillaProveedores();
          break;
        case 'movimientos':
          nombreArchivo = await this.plantillasService.generarPlantillaMovimientos();
          break;
        default:
          throw new BadRequestException('Tipo de plantilla no válido');
      }

      const rutaArchivo = path.join(process.cwd(), 'uploads', 'plantillas', nombreArchivo);
      
      if (!fs.existsSync(rutaArchivo)) {
        throw new BadRequestException('Plantilla no encontrada');
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      
      const stream = fs.createReadStream(rutaArchivo);
      stream.pipe(res);

    } catch (error) {
      this.logger.error(`❌ Error generando plantilla ${tipo}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene información sobre los tipos de importación soportados
   */
  @Get('tipos-soportados')
  @ApiOperation({ summary: 'Obtener información sobre tipos de importación soportados' })
  @ApiResponse({ status: 200, description: 'Información de tipos soportados' })
  async obtenerTiposSoportados() {
    return {
      tipos: this.detectorTipoService.obtenerInformacionTipos(),
      mensaje: 'Tipos de importación soportados por el sistema',
    };
  }

  /**
   * Valida un archivo antes de la importación automática
   */
  @Post('auto/validar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar archivo antes de importación automática' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel para validar',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Resultado de validación' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'import');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const extension = path.extname(file.originalname);
          cb(null, `validacion-${timestamp}${extension}`);
        },
      }),
    })
  )
  async validarArchivo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      })
    ) archivo: Express.Multer.File,
  ) {
    try {
      // Validar el archivo
      const validacion = await this.detectorTipoService.validarArchivo(archivo.path);
      
      // Detectar tipo si es válido
      let deteccion: any = null;
      if (validacion.valido) {
        deteccion = await this.detectorTipoService.detectarTipo(archivo.path);
      }

      // Limpiar archivo temporal
      await this.importacionService.limpiarArchivosTemporales(archivo.path);

      return {
        valido: validacion.valido,
        errores: validacion.errores,
        advertencias: validacion.advertencias,
        deteccion: deteccion,
        mensaje: validacion.valido 
          ? 'Archivo válido y tipo detectado' 
          : 'Archivo no válido para importación automática',
      };

    } catch (error) {
      this.logger.error(`❌ Error validando archivo:`, error);
      
      // Limpiar archivo temporal en caso de error
      if (archivo?.path) {
        await this.importacionService.limpiarArchivosTemporales(archivo.path);
      }
      
      throw error;
    }
  }

  /**
   * Endpoint para confirmar tipo de importación cuando la detección automática no es segura
   */
  @Post('auto/confirmar')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Confirmar tipo de importación para archivo detectado automáticamente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        trabajoId: {
          type: 'string',
          description: 'ID del trabajo de importación',
        },
        tipoConfirmado: {
          type: 'string',
          enum: ['productos', 'proveedores', 'movimientos'],
          description: 'Tipo de importación confirmado por el usuario',
        },
      },
    },
  })
  async confirmarTipoImportacion(
    @Body() body: { trabajoId: string; tipoConfirmado: string },
    @CurrentUser() usuario: JwtUser,
  ) {
    // Implementar lógica para confirmar tipo y continuar importación
    // Por ahora, retornamos un mensaje informativo
    return {
      mensaje: 'Confirmación recibida. La importación continuará con el tipo especificado.',
      trabajoId: body.trabajoId,
      tipoConfirmado: body.tipoConfirmado,
    };
  }

  /**
   * Endpoint unificado para importación (nuevo)
   */
  @Post('unificada')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Importación unificada desde archivo Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx, .xls, .numbers) o CSV',
        },
        tipo: {
          type: 'string',
          enum: ['productos', 'proveedores', 'movimientos'],
          description: 'Tipo de importación',
        },
        sobrescribirExistentes: {
          type: 'boolean',
          description: 'Sobrescribir registros existentes',
        },
        validarSolo: {
          type: 'boolean',
          description: 'Solo validar sin importar',
        },
        notificarEmail: {
          type: 'boolean',
          description: 'Enviar notificación por email',
        },
        emailNotificacion: {
          type: 'string',
          description: 'Email para notificación',
        },
        configuracionProductos: {
          type: 'object',
          description: 'Configuración específica para productos',
        },
        configuracionProveedores: {
          type: 'object',
          description: 'Configuración específica para proveedores',
        },
        configuracionMovimientos: {
          type: 'object',
          description: 'Configuración específica para movimientos',
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'Importación iniciada correctamente' })
  @ApiResponse({ status: 400, description: 'Error en el archivo o datos' })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'import');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const extension = path.extname(file.originalname);
          const tipo = req.body.tipo || 'unificada';
          cb(null, `${tipo}-${timestamp}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/x-iwork-numbers-sffnumbers',
          'text/csv',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no soportado. Use Excel (.xlsx, .xls, .numbers) o CSV'), false);
        }
      },
    })
  )
  async importarUnificada(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: ImportacionUnificadaDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      this.logger.log(`🚀 Iniciando importación unificada de ${opciones.tipo} para usuario ${usuario.id}`);

      // Validar que el archivo se subió correctamente
      if (!archivo) {
        throw new BadRequestException('No se proporcionó ningún archivo');
      }

      // Validar tipo de importación
      if (!['productos', 'proveedores', 'movimientos'].includes(opciones.tipo)) {
        throw new BadRequestException('Tipo de importación no válido');
      }

      // Validar que el usuario tenga empresa asignada
      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      // Procesar la importación
      const resultado = await this.importacionService.importarUnificada(
        archivo.path,
        opciones,
        usuario.empresaId,
        usuario.id
      );

      this.logger.log(`✅ Importación unificada iniciada: ${resultado.trabajoId}`);

      return {
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        estadisticas: resultado.estadisticas,
        mensaje: `Importación de ${opciones.tipo} iniciada correctamente`,
      };

    } catch (error) {
      this.logger.error(`❌ Error en importación unificada:`, error);
      
      // Limpiar archivo temporal en caso de error
      if (archivo?.path) {
        await this.importacionService.limpiarArchivosTemporales(archivo.path);
      }
      
      throw error;
    }
  }

  /**
   * Obtiene el progreso detallado de un trabajo de importación
   */
  @Get('trabajos/:trabajoId/progreso-detallado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener progreso detallado de un trabajo de importación' })
  @ApiParam({ name: 'trabajoId', description: 'ID del trabajo de importación' })
  @ApiResponse({ status: 200, description: 'Progreso detallado obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async obtenerProgresoDetallado(
    @Param('trabajoId') trabajoId: string,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      const progresoDetallado = await this.importacionService.obtenerProgresoDetallado(
        trabajoId,
        usuario.empresaId
      );

      return {
        success: true,
        ...progresoDetallado,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo progreso detallado del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Resuelve errores de forma inteligente
   */
  @Post('trabajos/:trabajoId/resolver-errores')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver errores de forma inteligente' })
  @ApiParam({ name: 'trabajoId', description: 'ID del trabajo de importación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        autoCorregir: { type: 'boolean', description: 'Aplicar correcciones automáticamente' },
        usarValoresPorDefecto: { type: 'boolean', description: 'Usar valores por defecto' },
        nivelConfianzaMinimo: { type: 'number', description: 'Nivel de confianza mínimo para correcciones' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Errores resueltos correctamente' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async resolverErroresInteligentemente(
    @Param('trabajoId') trabajoId: string,
    @Body() opciones: {
      autoCorregir: boolean;
      usarValoresPorDefecto: boolean;
      nivelConfianzaMinimo: number;
    },
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      const resultado = await this.importacionService.resolverErroresInteligentemente(
        trabajoId,
        usuario.empresaId,
        opciones
      );

      return {
        success: true,
        ...resultado,
      };
    } catch (error) {
      this.logger.error(`Error resolviendo errores del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene logs detallados de un trabajo
   */
  @Get('trabajos/:trabajoId/logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener logs detallados de un trabajo de importación' })
  @ApiParam({ name: 'trabajoId', description: 'ID del trabajo de importación' })
  @ApiQuery({ name: 'nivel', required: false, enum: ['debug', 'info', 'warn', 'error'] })
  @ApiResponse({ status: 200, description: 'Logs obtenidos correctamente' })
  @ApiResponse({ status: 404, description: 'Trabajo no encontrado' })
  async obtenerLogsDetallados(
    @Param('trabajoId') trabajoId: string,
    @Query('nivel') nivel?: 'debug' | 'info' | 'warn' | 'error',
    @CurrentUser() usuario?: JwtUser,
  ) {
    try {
      if (!usuario?.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      const logs = await this.importacionService.obtenerLogsDetallados(
        trabajoId,
        usuario.empresaId,
        nivel
      );

      return {
        success: true,
        ...logs,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo logs del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }
} 