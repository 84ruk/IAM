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
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImportacionService } from './importacion.service';
import { 
  ImportarProductosDto, 
  ImportarProveedoresDto, 
  ImportarMovimientosDto 
} from './dto';
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
  constructor(private readonly importacionService: ImportacionService) {}

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
          description: 'Archivo Excel (.xlsx, .xls) o CSV',
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
          'text/csv',
          'application/csv',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
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
          new FileTypeValidator({ fileType: '.(xlsx|xls|csv)' }),
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: ImportarProductosDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
      if (!usuario.empresaId) {
        throw new BadRequestException('Usuario no tiene empresa asignada');
      }

      const resultado = await this.importacionService.importarProductos(
        archivo.path,
        opciones,
        usuario.empresaId,
        usuario.id
      );

      return {
        success: true,
        message: resultado.mensaje,
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        totalRegistros: resultado.totalRegistros,
        errores: resultado.errores,
      };
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
          description: 'Archivo Excel (.xlsx, .xls) o CSV',
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
          'text/csv',
          'application/csv',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
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
          new FileTypeValidator({ fileType: '.(xlsx|xls|csv)' }),
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: ImportarProveedoresDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
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
        message: resultado.mensaje,
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        totalRegistros: resultado.totalRegistros,
        errores: resultado.errores,
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
          description: 'Archivo Excel (.xlsx, .xls) o CSV',
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
          'text/csv',
          'application/csv',
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
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
          new FileTypeValidator({ fileType: '.(xlsx|xls|csv)' }),
        ],
      })
    ) archivo: Express.Multer.File,
    @Body() opciones: ImportarMovimientosDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    try {
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
        message: resultado.mensaje,
        trabajoId: resultado.trabajoId,
        estado: resultado.estado,
        totalRegistros: resultado.totalRegistros,
        errores: resultado.errores,
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
} 