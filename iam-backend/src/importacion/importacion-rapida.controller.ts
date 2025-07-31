import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { ImportacionRapidaService } from './services/importacion-rapida.service';
import { ImportacionRapidaDto } from './dto/importacion-rapida.dto';
import { DetectorTipoImportacionService } from './servicios/detector-tipo-importacion.service';

@Controller('importacion/rapida')
@UseGuards(JwtAuthGuard)
export class ImportacionRapidaController {
  private readonly logger = new Logger(ImportacionRapidaController.name);

  constructor(
    private readonly importacionRapidaService: ImportacionRapidaService,
    private readonly detectorTipoService: DetectorTipoImportacionService,
  ) {}

  @Post()
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
  async importarRapida(
    @UploadedFile() file: Express.Multer.File,
    @Body() importacionDto: ImportacionRapidaDto,
    @CurrentUser() user: JwtUser,
  ) {
    try {
      this.logger.log(
        `Iniciando importación rápida - Usuario: ${user.email}, Tipo: ${importacionDto.tipo}, Archivo: ${file?.originalname}`,
      );

      if (!file) {
        throw new HttpException('Archivo no proporcionado', HttpStatus.BAD_REQUEST);
      }

      // Validar tipo de archivo
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        throw new HttpException(
          `Extensión no soportada: ${fileExtension}. Use: ${validExtensions.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar tamaño del archivo (máximo 10MB para importación rápida)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new HttpException(
          `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo: ${maxSize / 1024 / 1024}MB`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 🔍 DETECCIÓN AUTOMÁTICA DE TIPO
      let tipoDetectado: string | null = null;
      let confianzaDetectada = 0;
      let tipoFinal: string;
      let mensajeDeteccion = '';

      try {
        const deteccion = await this.detectorTipoService.detectarTipo(file.path);
        tipoDetectado = deteccion.tipo;
        confianzaDetectada = deteccion.confianza;
        
        this.logger.log(`🔍 Tipo detectado automáticamente: ${tipoDetectado} (confianza: ${confianzaDetectada}%)`);
        
        // Si el tipo seleccionado es 'auto', usar directamente el detectado
        if (importacionDto.tipo.toLowerCase() === 'auto') {
          tipoFinal = tipoDetectado;
          mensajeDeteccion = `Tipo detectado automáticamente: ${tipoDetectado} (confianza: ${confianzaDetectada}%)`;
          this.logger.log(`✅ Usando tipo detectado automáticamente: ${tipoFinal}`);
        } else {
          // Comparar tipo detectado con tipo seleccionado
          const tipoSeleccionado = importacionDto.tipo;
          const tiposCoinciden = this.compararTipos(tipoDetectado, tipoSeleccionado);
          
          if (!tiposCoinciden) {
            this.logger.warn(`⚠️ Discrepancia de tipos: Seleccionado: ${tipoSeleccionado}, Detectado: ${tipoDetectado}`);
            // En importación inteligente, usar automáticamente el tipo detectado si tiene buena confianza
            if (confianzaDetectada >= 70) {
              tipoFinal = tipoDetectado;
              mensajeDeteccion = `Tipo automáticamente corregido: ${tipoDetectado} (detectado con ${confianzaDetectada}% de confianza)`;
              this.logger.log(`✅ Usando tipo detectado automáticamente: ${tipoFinal}`);
            } else {
              // Si la confianza es baja, usar el tipo seleccionado
              tipoFinal = tipoSeleccionado;
              mensajeDeteccion = `Usando tipo seleccionado: ${tipoSeleccionado} (detección con baja confianza: ${confianzaDetectada}%)`;
              this.logger.log(`⚠️ Usando tipo seleccionado por baja confianza: ${tipoFinal}`);
            }
          } else if (confianzaDetectada < 70) {
            this.logger.warn(`⚠️ Baja confianza en detección: ${confianzaDetectada}%`);
            tipoFinal = tipoSeleccionado;
            mensajeDeteccion = `Usando tipo seleccionado: ${tipoSeleccionado} (detección con baja confianza: ${confianzaDetectada}%)`;
            this.logger.log(`⚠️ Usando tipo seleccionado por baja confianza: ${tipoFinal}`);
          } else {
            this.logger.log(`✅ Tipos coinciden: ${tipoSeleccionado} (confianza: ${confianzaDetectada}%)`);
            tipoFinal = tipoSeleccionado;
            mensajeDeteccion = `Tipo confirmado: ${tipoSeleccionado} (detectado automáticamente con ${confianzaDetectada}% de confianza)`;
          }
        }
        
      } catch (error) {
        this.logger.warn(`⚠️ Error en detección automática: ${error.message}`);
        // Continuar con el tipo seleccionado si la detección falla
        tipoDetectado = importacionDto.tipo;
        confianzaDetectada = 0;
        tipoFinal = importacionDto.tipo;
        mensajeDeteccion = `No se pudo detectar automáticamente el tipo. Continuando con ${importacionDto.tipo} seleccionado.`;
        
        // Si el error es crítico, podríamos decidir no continuar
        if (error.message.includes('archivo corrupto') || error.message.includes('formato no válido')) {
          throw new HttpException(
            `Error al leer el archivo: ${error.message}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Procesar importación rápida con el tipo final determinado
      const startTime = Date.now();
      const result = await this.importacionRapidaService.procesarImportacionRapida(
        file,
        tipoFinal, // Usar el tipo final determinado automáticamente
        user,
        importacionDto,
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Importación rápida completada - Tipo usado: ${tipoFinal}, Registros: ${result.registrosExitosos}, Errores: ${result.registrosConError}, Tiempo: ${processingTime}ms`,
      );

      // Determinar el mensaje basado en el resultado
      let message = 'Importación completada exitosamente';
      if (result.registrosConError > 0) {
        if (result.registrosExitosos === 0) {
          message = `Importación falló: ${result.registrosConError} errores encontrados`;
        } else {
          message = `Importación parcial: ${result.registrosExitosos} exitosos, ${result.registrosConError} errores`;
        }
      }

      return {
        success: result.registrosConError === 0 || result.registrosExitosos > 0,
        data: {
          ...result,
          processingTime,
          mode: 'http',
          usuarioId: user.id,
          empresaId: user.empresaId,
        },
        message,
        hasErrors: result.registrosConError > 0,
        errorCount: result.registrosConError,
        successCount: result.registrosExitosos,
        errorFile: result.archivoErrores,
        // Información de detección automática
        tipoDetectado: tipoDetectado,
        tipoUsado: tipoFinal,
        confianzaDetectada: confianzaDetectada,
        mensajeDeteccion: mensajeDeteccion,
        // Agregar errores explícitamente para el frontend
        errores: result.errores || [],
        registrosProcesados: result.registrosProcesados,
        registrosExitosos: result.registrosExitosos,
        registrosConError: result.registrosConError,
      };
    } catch (error) {
      this.logger.error(
        `Error en importación rápida - Usuario: ${user.email}, Error: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      // Proporcionar información más detallada del error
      const errorDetails = {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
        user: user.email,
        file: file?.originalname,
        tipo: importacionDto.tipo
      };

      throw new HttpException(
        {
          message: `Error en importación: ${error.message}`,
          details: errorDetails,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Endpoint para confirmar tipo cuando hay discrepancia
   */
  @Post('confirmar-tipo')
  async confirmarTipo(
    @Body() body: {
      archivoTemporal: string;
      tipoConfirmado: string;
    },
    @CurrentUser() user: JwtUser,
  ) {
    try {
      this.logger.log(
        `Confirmando tipo de importación - Usuario: ${user.email}, Tipo confirmado: ${body.tipoConfirmado}`,
      );

      // Verificar que el archivo temporal existe
      if (!fs.existsSync(body.archivoTemporal)) {
        throw new HttpException('Archivo temporal no encontrado', HttpStatus.BAD_REQUEST);
      }

      // Crear un objeto file simulado para el servicio
      const file = {
        path: body.archivoTemporal,
        originalname: path.basename(body.archivoTemporal),
        size: fs.statSync(body.archivoTemporal).size,
      } as Express.Multer.File;

      // Crear DTO con el tipo confirmado
      const importacionDto = new ImportacionRapidaDto();
      importacionDto.tipo = body.tipoConfirmado;

      // Procesar importación con el tipo confirmado
      const startTime = Date.now();
      const result = await this.importacionRapidaService.procesarImportacionRapida(
        file,
        body.tipoConfirmado,
        user,
        importacionDto,
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Importación confirmada completada - Registros: ${result.registrosExitosos}, Errores: ${result.registrosConError}, Tiempo: ${processingTime}ms`,
      );

      // Limpiar archivo temporal
      try {
        fs.unlinkSync(body.archivoTemporal);
        this.logger.log(`Archivo temporal eliminado después de confirmación: ${body.archivoTemporal}`);
      } catch (cleanupError) {
        this.logger.warn(`No se pudo eliminar archivo temporal: ${body.archivoTemporal}`);
      }

      let message = 'Importación completada exitosamente';
      if (result.registrosConError > 0) {
        if (result.registrosExitosos === 0) {
          message = `Importación falló: ${result.registrosConError} errores encontrados`;
        } else {
          message = `Importación parcial: ${result.registrosExitosos} exitosos, ${result.registrosConError} errores`;
        }
      }

      return {
        success: result.registrosConError === 0 || result.registrosExitosos > 0,
        data: {
          ...result,
          processingTime,
          mode: 'http',
          usuarioId: user.id,
          empresaId: user.empresaId,
        },
        message,
        hasErrors: result.registrosConError > 0,
        errorCount: result.registrosConError,
        successCount: result.registrosExitosos,
        errorFile: result.archivoErrores,
        tipoConfirmado: body.tipoConfirmado,
      };

    } catch (error) {
      this.logger.error(
        `Error confirmando tipo - Usuario: ${user.email}, Error: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error confirmando tipo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Compara tipos de importación considerando variaciones
   */
  private compararTipos(tipoDetectado: string, tipoSeleccionado: string): boolean {
    const normalizarTipo = (tipo: string): string => {
      return tipo.toLowerCase().replace(/[^a-z]/g, '');
    };

    const tipoDetectadoNormalizado = normalizarTipo(tipoDetectado);
    const tipoSeleccionadoNormalizado = normalizarTipo(tipoSeleccionado);

    // Si el tipo seleccionado es 'auto', siempre usar el detectado
    if (tipoSeleccionadoNormalizado === 'auto') {
      return true; // Indicar que no hay discrepancia para usar el detectado
    }

    return tipoDetectadoNormalizado === tipoSeleccionadoNormalizado;
  }
} 