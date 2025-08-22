import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UnifiedEmpresaGuard } from '../../auth/guards/unified-empresa.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { EmpresaRequired } from '../../auth/decorators/empresa-required.decorator';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UmbralesSensorDto } from '../dto/umbrales-sensor.dto';

@Controller('sensores/:sensorId/umbrales')
@UseGuards(JwtAuthGuard, RolesGuard, UnifiedEmpresaGuard)
@EmpresaRequired()
export class UmbralesSensorController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🎯 Obtiene la configuración de umbrales de un sensor específico
   */
  @Get()
  @Roles('SUPERADMIN', 'ADMIN', 'EMPLEADO')
  async obtenerUmbrales(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @CurrentUser() currentUser: JwtUser,
  ) {
    try {
      // Verificar que el sensor pertenece a la empresa del usuario
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorId,
          empresaId: currentUser.empresaId!,
          activo: true,
        },
        include: {
          configuracionAlerta: {
            include: {
              destinatarios: {
                include: {
                  destinatario: true,
                },
              },
            },
          },
        },
      });

      if (!sensor) {
        throw new Error('Sensor no encontrado o no tienes acceso');
      }

      if (!sensor.configuracionAlerta) {
        // Si no hay configuración, crear una por defecto
        const configuracionPorDefecto = await this.crearConfiguracionPorDefecto(
          sensorId,
          currentUser.empresaId!,
          sensor.tipo,
        );
        return {
          success: true,
          message: 'Configuración por defecto creada',
          data: {
            sensor: {
              id: sensor.id,
              nombre: sensor.nombre,
              tipo: sensor.tipo,
            },
            configuracion: configuracionPorDefecto,
          },
        };
      }

      return {
        success: true,
        message: 'Configuración de umbrales obtenida',
        data: {
          sensor: {
            id: sensor.id,
            nombre: sensor.nombre,
            tipo: sensor.tipo,
          },
          configuracion: sensor.configuracionAlerta,
        },
      };
    } catch (error) {
      throw new Error(`Error obteniendo umbrales: ${error.message}`);
    }
  }

  /**
   * 🎯 Actualiza la configuración de umbrales de un sensor
   */
  @Put()
  @Roles('SUPERADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async actualizarUmbrales(
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Body() umbralesDto: UmbralesSensorDto,
    @CurrentUser() currentUser: JwtUser,
  ) {
    try {
      // Verificar que el sensor pertenece a la empresa del usuario
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: sensorId,
          empresaId: currentUser.empresaId!,
          activo: true,
        },
      });

      if (!sensor) {
        throw new Error('Sensor no encontrado o no tienes acceso');
      }

      // Validar los umbrales antes de guardar
      this.validarUmbrales(umbralesDto);

      // Buscar o crear configuración de alerta
      let configuracion = await this.prisma.configuracionAlerta.findFirst({
        where: {
          sensorId: sensorId,
          empresaId: currentUser.empresaId!,
        },
      });

      if (!configuracion) {
        // Crear nueva configuración
        configuracion = await this.prisma.configuracionAlerta.create({
          data: {
            empresaId: currentUser.empresaId!,
            sensorId: sensorId,
            tipoAlerta: sensor.tipo,
            activo: true,
            frecuencia: 'IMMEDIATE',
            ventanaEsperaMinutos: 5,
            umbralCritico: umbralesDto as unknown as Prisma.InputJsonValue,
            configuracionNotificacion: {
              email: true,
              sms: true,
              webSocket: true,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      } else {
        // Actualizar configuración existente
        configuracion = await this.prisma.configuracionAlerta.update({
          where: { id: configuracion.id },
        data: {
            umbralCritico: umbralesDto as unknown as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
        });
      }

      return {
        success: true,
        message: 'Umbrales actualizados correctamente',
        data: {
          sensor: {
            id: sensor.id,
            nombre: sensor.nombre,
            tipo: sensor.tipo,
          },
          configuracion: configuracion,
        },
      };
    } catch (error) {
      throw new Error(`Error actualizando umbrales: ${error.message}`);
    }
  }

  /**
   * 🔧 Crea configuración por defecto para un sensor
   */
  private async crearConfiguracionPorDefecto(
    sensorId: number,
    empresaId: number,
    tipoSensor: string,
  ) {
    let umbralesPorDefecto: any;

    switch (tipoSensor) {
      case 'TEMPERATURA':
        umbralesPorDefecto = {
          tipo: 'TEMPERATURA',
          unidad: '°C',
          precision: 0.1,
          rango_min: 15,
          rango_max: 25,
          umbral_alerta_bajo: 18,
          umbral_alerta_alto: 22,
          umbral_critico_bajo: 15,
          umbral_critico_alto: 25,
          severidad: 'MEDIA',
          intervalo_lectura: 10000,
          alertasActivas: true,
        };
        break;
      case 'HUMEDAD':
        umbralesPorDefecto = {
          tipo: 'HUMEDAD',
          unidad: '%',
          precision: 0.1,
          rango_min: 30,
          rango_max: 80,
          umbral_alerta_bajo: 35,
          umbral_alerta_alto: 75,
          umbral_critico_bajo: 30,
          umbral_critico_alto: 80,
          severidad: 'MEDIA',
          intervalo_lectura: 30000,
          alertasActivas: true,
        };
        break;
      case 'PESO':
        umbralesPorDefecto = {
          tipo: 'PESO',
          unidad: 'kg',
          precision: 0.1,
          rango_min: 100,
          rango_max: 900,
          umbral_alerta_bajo: 150,
          umbral_alerta_alto: 850,
          umbral_critico_bajo: 100,
          umbral_critico_alto: 900,
          severidad: 'MEDIA',
          intervalo_lectura: 60000,
          alertasActivas: true,
        };
        break;
      default:
        umbralesPorDefecto = {
          tipo: tipoSensor,
          unidad: 'unidad',
          precision: 0.1,
          rango_min: 0,
          rango_max: 100,
          umbral_alerta_bajo: 10,
          umbral_alerta_alto: 90,
          umbral_critico_bajo: 0,
          umbral_critico_alto: 100,
          severidad: 'MEDIA',
          intervalo_lectura: 30000,
          alertasActivas: true,
        };
    }

    const configuracion = await this.prisma.configuracionAlerta.create({
        data: {
        empresaId: empresaId,
        sensorId: sensorId,
        tipoAlerta: tipoSensor,
        activo: true,
        frecuencia: 'IMMEDIATE',
        ventanaEsperaMinutos: 5,
        umbralCritico: umbralesPorDefecto as unknown as Prisma.InputJsonValue,
        configuracionNotificacion: {
          email: true,
          sms: true,
          webSocket: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return configuracion;
  }

  /**
   * ✅ Valida que los umbrales sean lógicos
   */
  private validarUmbrales(umbrales: UmbralesSensorDto) {
    const errores: string[] = [];

    // Validar que los rangos sean lógicos
    if (umbrales.rango_min >= umbrales.rango_max) {
      errores.push('El rango mínimo debe ser menor que el máximo');
    }

    if (umbrales.umbral_alerta_bajo >= umbrales.umbral_alerta_alto) {
      errores.push('El umbral de alerta bajo debe ser menor que el alto');
    }

    if (umbrales.umbral_critico_bajo >= umbrales.umbral_critico_alto) {
      errores.push('El umbral crítico bajo debe ser menor que el alto');
    }

    // Validar que los umbrales estén dentro del rango
    if (umbrales.umbral_alerta_bajo < umbrales.rango_min) {
      errores.push('El umbral de alerta bajo no puede ser menor que el rango mínimo');
    }

    if (umbrales.umbral_alerta_alto > umbrales.rango_max) {
      errores.push('El umbral de alerta alto no puede ser mayor que el rango máximo');
    }

    if (umbrales.umbral_critico_bajo < umbrales.rango_min) {
      errores.push('El umbral crítico bajo no puede ser menor que el rango mínimo');
    }

    if (umbrales.umbral_critico_alto > umbrales.rango_max) {
      errores.push('El umbral crítico alto no puede ser mayor que el rango máximo');
    }

    if (errores.length > 0) {
      throw new Error(`Umbrales inválidos: ${errores.join(', ')}`);
    }
  }
}
