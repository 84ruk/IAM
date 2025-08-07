import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { SMSTemplateService, SMSTemplate } from './services/sms-template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../auth/guards/unified-empresa.guard';
import { EmpresaRequired } from '../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';

export class CrearPlantillaDto {
  nombre: string;
  tipo: string;
  contenido: string;
  variables: string[];
  prioridad?: 'low' | 'normal' | 'high' | 'urgent';
  emoji?: string;
}

export class ProcesarPlantillaDto {
  templateId: string;
  datos: Record<string, any>;
}

@UseGuards(JwtAuthGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
@Controller('sms-templates')
export class SMSTemplateController {
  constructor(private readonly templateService: SMSTemplateService) {}

  @Get()
  async obtenerPlantillas(@Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    return this.templateService.obtenerPlantillas();
  }

  @Get('variables')
  async obtenerVariables(@Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    return this.templateService.obtenerVariables();
  }

  @Get('por-prioridad')
  async obtenerPlantillasPorPrioridad(
    @Request() req,
    @Query('prioridad') prioridad: 'low' | 'normal' | 'high' | 'urgent',
  ) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    if (!['low', 'normal', 'high', 'urgent'].includes(prioridad)) {
      throw new BadRequestException('Prioridad inválida');
    }

    return this.templateService.obtenerPlantillasPorPrioridad(prioridad);
  }

  @Get('con-emoji')
  async obtenerPlantillasConEmoji(@Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    return this.templateService.obtenerPlantillasConEmoji();
  }

  @Get(':id')
  async obtenerPlantilla(@Param('id') id: string, @Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    const plantilla = this.templateService.obtenerPlantillaPorId(id);
    if (!plantilla) {
      throw new BadRequestException('Plantilla no encontrada');
    }

    return plantilla;
  }

  @Post('crear')
  async crearPlantilla(@Body() dto: CrearPlantillaDto, @Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    // Validar la plantilla
    const validacion = this.templateService.validarPlantilla(dto.contenido, dto.variables);
    if (!validacion.valido) {
      throw new BadRequestException(`Plantilla inválida: ${validacion.errores.join(', ')}`);
    }

    const plantilla = this.templateService.crearPlantillaPersonalizada(
      dto.nombre,
      dto.tipo,
      dto.contenido,
      dto.variables,
      dto.prioridad || 'normal',
      dto.emoji,
    );

    return {
      success: true,
      message: 'Plantilla creada correctamente',
      plantilla,
    };
  }

  @Post('procesar')
  async procesarPlantilla(@Body() dto: ProcesarPlantillaDto, @Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    try {
      const mensajeProcesado = this.templateService.procesarPlantilla(dto.templateId, dto.datos);
      
      return {
        success: true,
        mensajeProcesado,
        longitud: mensajeProcesado.length,
        dentroDeLimite: mensajeProcesado.length <= 160,
      };
    } catch (error) {
      throw new BadRequestException(`Error procesando plantilla: ${error.message}`);
    }
  }

  @Post('procesar-por-tipo')
  async procesarPlantillaPorTipo(
    @Body() data: { tipo: string; datos: Record<string, any> },
    @Request() req,
  ) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    try {
      const mensajeProcesado = this.templateService.procesarPlantillaPorTipo(data.tipo, data.datos);
      
      return {
        success: true,
        mensajeProcesado,
        longitud: mensajeProcesado.length,
        dentroDeLimite: mensajeProcesado.length <= 160,
        tipo: data.tipo,
      };
    } catch (error) {
      throw new BadRequestException(`Error procesando plantilla por tipo: ${error.message}`);
    }
  }

  @Post('validar')
  async validarPlantilla(@Body() data: { contenido: string; variables: string[] }, @Request() req) {
    const user = req.user as JwtUser;
    if (!user.empresaId) {
      throw new BadRequestException('El usuario debe tener una empresa configurada');
    }

    const validacion = this.templateService.validarPlantilla(data.contenido, data.variables);
    
    return {
      valido: validacion.valido,
      errores: validacion.errores,
      longitud: data.contenido.length,
      dentroDeLimite: data.contenido.length <= 160,
    };
  }
} 