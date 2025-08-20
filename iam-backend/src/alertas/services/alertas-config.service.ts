import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfiguracionSistemaAlertasDto } from '../dto/configuracion-sistema-alertas.dto';
import { Prisma } from '@prisma/client';
import { Rol } from '@prisma/client';

@Injectable()
export class AlertasConfigService {
  private readonly logger = new Logger(AlertasConfigService.name);

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

  async obtenerConfiguracion(empresaId: number): Promise<ConfiguracionSistemaAlertasDto> {
    const row = await this.prisma.configuracionAlerta.findFirst({
      where: { empresaId, tipoAlerta: 'SISTEMA' },
    });

    if (!row) {
      // Retornar valores por defecto
      return this.mapFromRow({ empresaId, activo: true, umbralCritico: {} });
    }

    return this.mapFromRow(row);
  }

  async crear(config: ConfiguracionSistemaAlertasDto, userRol: Rol, empresaId: number): Promise<ConfiguracionSistemaAlertasDto> {
    // Validación adicional de permisos si es necesario
    if (userRol !== Rol.SUPERADMIN && config.empresaId !== empresaId) {
      throw new ForbiddenException('No autorizado para crear configuración para otra empresa');
    }

    const saved = await this.prisma.configuracionAlerta.create({
      data: {
        empresaId: config.empresaId,
        sensorId: 0, // 0 para alertas del sistema
        tipoAlerta: 'SISTEMA',
        activo: config.sistemaActivado,
        frecuencia: 'inmediata',
        umbralCritico: config.umbralCritico ? config.umbralCritico : {},
        configuracionNotificacion: config.configuracionNotificacion ? config.configuracionNotificacion : {},
      },
    });

    return this.mapFromRow(saved);
  }

  async actualizar(id: number, config: ConfiguracionSistemaAlertasDto, userRol: Rol, empresaId: number): Promise<ConfiguracionSistemaAlertasDto> {
    const row = await this.prisma.configuracionAlerta.findUnique({ 
      where: { id }
    });

    if (!row) {
      throw new NotFoundException(`Configuración de alertas con ID ${id} no encontrada`);
    }

    if (userRol !== Rol.SUPERADMIN && row.empresaId !== empresaId) {
      throw new ForbiddenException('No autorizado para actualizar esta configuración');
    }

    const updated = await this.prisma.configuracionAlerta.update({
      where: { id },
      data: {
        activo: config.sistemaActivado,
        umbralCritico: config.umbralCritico ? config.umbralCritico : {},
        configuracionNotificacion: config.configuracionNotificacion ? config.configuracionNotificacion : {},
      },
    });

    return this.mapFromRow(updated);
  }
}
