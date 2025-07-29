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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { ImportacionRapidaService } from './services/importacion-rapida.service';
import { ImportacionRapidaDto } from './dto/importacion-rapida.dto';

@Controller('importacion/rapida')
@UseGuards(JwtAuthGuard)
export class ImportacionRapidaController {
  private readonly logger = new Logger(ImportacionRapidaController.name);

  constructor(
    private readonly importacionRapidaService: ImportacionRapidaService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
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

      // Procesar importación rápida
      const startTime = Date.now();
      const result = await this.importacionRapidaService.procesarImportacionRapida(
        file,
        importacionDto.tipo,
        user,
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Importación rápida completada - Registros: ${result.registrosExitosos}, Errores: ${result.registrosConError}, Tiempo: ${processingTime}ms`,
      );

      return {
        success: true,
        data: {
          ...result,
          processingTime,
          mode: 'http',
          usuarioId: user.id,
          empresaId: user.empresaId,
        },
        message: 'Importación completada exitosamente',
      };
    } catch (error) {
      this.logger.error(
        `Error en importación rápida - Usuario: ${user.email}, Error: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error en importación: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 