import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Estructuras esperadas por el frontend (shape compatible)
interface ConfiguracionSistemaAlertasDto {
  id?: number;
  empresaId: number;
  sistemaActivado: boolean;
  modoDebug: boolean;
  escalamientoAutomatico: boolean;
  tiempoEscalamientoMinutos: number;
  maximoNivelEscalamiento: number;
  canalesHabilitados: Array<'EMAIL' | 'SMS' | 'WEBSOCKET' | 'PUSH'>;
  destinatariosPrincipales: string[];
  destinatariosSupervisores: string[];
  destinatariosAdministradores: string[];
  plantillaEmailNormal: string;
  plantillaEmailCritica: string;
  plantillaSMSNormal: string;
  plantillaSMSCritica: string;
  maximoReintentos: number;
  intervaloReintentosMinutos: number;
  horarioBlackout: { horaInicio: string; horaFin: string; diasSemana: number[] };
  agruparAlertas: boolean;
  ventanaAgrupacionMinutos: number;
}

@UseGuards(JwtAuthGuard)
@Controller('empresas')
export class AlertasConfigController {
  constructor(private readonly prisma: PrismaService) {}

  private mapFromRow(row: any): ConfiguracionSistemaAlertasDto {
    const json = (row?.umbralCritico as any) || {};
    const canales = Array.isArray(json.canalesHabilitados)
      ? (json.canalesHabilitados.filter((c: string) => ['EMAIL', 'SMS', 'WEBSOCKET', 'PUSH'].includes(c)) as Array<'EMAIL'|'SMS'|'WEBSOCKET'|'PUSH'>)
      : (['EMAIL', 'WEBSOCKET'] as Array<'EMAIL'|'SMS'|'WEBSOCKET'|'PUSH'>);

    return {
      id: row?.id,
      empresaId: row.empresaId,
      sistemaActivado: row?.activo ?? true,
      modoDebug: Boolean(json.modoDebug ?? false),
      escalamientoAutomatico: Boolean(json.escalamientoAutomatico ?? true),
      tiempoEscalamientoMinutos: Number(json.tiempoEscalamientoMinutos ?? 10),
      maximoNivelEscalamiento: Number(json.maximoNivelEscalamiento ?? 3),
      canalesHabilitados: canales,
      destinatariosPrincipales: (json.destinatariosPrincipales as string[]) || [],
      destinatariosSupervisores: (json.destinatariosSupervisores as string[]) || [],
      destinatariosAdministradores: (json.destinatariosAdministradores as string[]) || [],
      plantillaEmailNormal: String(json.plantillaEmailNormal || ''),
      plantillaEmailCritica: String(json.plantillaEmailCritica || ''),
      plantillaSMSNormal: String(json.plantillaSMSNormal || ''),
      plantillaSMSCritica: String(json.plantillaSMSCritica || ''),
      maximoReintentos: Number(json.maximoReintentos ?? 3),
      intervaloReintentosMinutos: Number(json.intervaloReintentosMinutos ?? 5),
      horarioBlackout: json.horarioBlackout || { horaInicio: '00:00', horaFin: '00:00', diasSemana: [] },
      agruparAlertas: Boolean(json.agruparAlertas ?? false),
      ventanaAgrupacionMinutos: Number(json.ventanaAgrupacionMinutos ?? 10),
    };
  }

  @Get(':empresaId/alertas/configuracion')
  async obtener(@Request() req, @Param('empresaId') empresaIdParam: string) {
    const empresaId = Number(empresaIdParam);
    if (empresaId !== req.user.empresaId) {
      throw new HttpException('Empresa inválida', HttpStatus.FORBIDDEN);
    }
    const row = await this.prisma.alertConfiguration.findFirst({
      where: { empresaId, tipoAlerta: 'SISTEMA' },
    });
    if (!row) {
      // retornar valores por defecto
      return this.mapFromRow({ empresaId, activo: true, umbralCritico: {} });
    }
    return this.mapFromRow(row);
  }

  @Post('alertas/configuracion')
  async crear(@Request() req, @Body() body: ConfiguracionSistemaAlertasDto) {
    if (body.empresaId !== req.user.empresaId) {
      throw new HttpException('Empresa inválida', HttpStatus.FORBIDDEN);
    }
    const saved = await this.prisma.alertConfiguration.create({
      data: {
        empresaId: body.empresaId,
        tipoAlerta: 'SISTEMA',
        activo: body.sistemaActivado,
        destinatarios: body.destinatariosPrincipales || [],
        frecuencia: 'inmediata',
        ventanaEsperaMinutos: body.tiempoEscalamientoMinutos,
        umbralCritico: (body as unknown) as Prisma.InputJsonValue, // almacenamos toda la config como JSON
      },
    });
    return this.mapFromRow(saved);
  }

  @Put('alertas/configuracion/:id')
  async actualizar(@Request() req, @Param('id') id: string, @Body() body: ConfiguracionSistemaAlertasDto) {
    const row = await this.prisma.alertConfiguration.findUnique({ where: { id: Number(id) } });
    if (!row || row.empresaId !== req.user.empresaId) {
      throw new HttpException('No autorizado', HttpStatus.FORBIDDEN);
    }
    const updated = await this.prisma.alertConfiguration.update({
      where: { id: Number(id) },
      data: {
        activo: body.sistemaActivado,
        destinatarios: body.destinatariosPrincipales || [],
        ventanaEsperaMinutos: body.tiempoEscalamientoMinutos,
        umbralCritico: (body as unknown) as Prisma.InputJsonValue,
      },
    });
    return this.mapFromRow(updated);
  }
}


