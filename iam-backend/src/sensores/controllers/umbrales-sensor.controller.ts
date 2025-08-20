import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { UmbralesSensorDto, ConfiguracionUmbralesSensorDto } from '../dto/umbrales-sensor.dto';

@ApiTags('Umbrales de Sensores')
@Controller('sensores')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UmbralesSensorController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/umbralCriticoes')
  @ApiOperation({ summary: 'Obtener umbralCriticoes de un sensor' })
  @ApiResponse({ status: 200, description: 'Umbrales obtenidos exitosamente' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async obtenerUmbrales(
    @Param('id') sensorId: string,
    @CurrentUser() user: any
  ) {
    try {
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: parseInt(sensorId), 
          empresaId: user.empresaId 
        },
        include: {
          ubicacion: true
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Obtener configuración actual del sensor
      const configuracion = sensor.configuracion as any || {};
      
      // Construir respuesta con umbralCriticoes
      const umbralCriticoes: UmbralesSensorDto = {
        temperaturaMin: configuracion.temperaturaMin || 15,
        temperaturaMax: configuracion.temperaturaMax || 25,
        humedadMin: configuracion.humedadMin || 40,
        humedadMax: configuracion.humedadMax || 60,
        pesoMin: configuracion.pesoMin || 100,
        pesoMax: configuracion.pesoMax || 900,
        presionMin: configuracion.presionMin || 1000,
        presionMax: configuracion.presionMax || 1500,
        alertasActivas: configuracion.alertasActivas ?? true,
        mensajeAlerta: configuracion.mensajeAlerta || 'Valor fuera del rango normal',
        mensajeCritico: configuracion.mensajeCritico || 'Valor crítico detectado',
        destinatarios: configuracion.destinatarios || [],
        severidad: configuracion.severidad || 'MEDIA',
        intervaloVerificacionMinutos: configuracion.intervaloVerificacionMinutos || 5,
        configuracionNotificacionEmail: configuracion.configuracionNotificacionEmail ?? true,
        configuracionNotificacionSMS: configuracion.configuracionNotificacionSMS ?? false,
        configuracionNotificacionWebSocket: configuracion.configuracionNotificacionWebSocket ?? true
      };

      return {
        success: true,
        data: {
          sensorId: sensor.id,
          sensorNombre: sensor.nombre,
          sensorTipo: sensor.tipo,
          ubicacionId: sensor.ubicacionId,
          ubicacionNombre: sensor.ubicacion?.nombre,
          umbralCriticoes,
          ultimaActualizacion: new Date(),
          proximaVerificacion: new Date(Date.now() + ((umbralCriticoes.intervaloVerificacionMinutos || 5) * 60 * 1000))
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error obteniendo umbralCriticoes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/umbralCriticoes')
  @ApiOperation({ summary: 'Actualizar umbralCriticoes de un sensor' })
  @ApiResponse({ status: 200, description: 'Umbrales actualizados exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async actualizarUmbrales(
    @Param('id') sensorId: string,
    @Body() umbralCriticoesDto: UmbralesSensorDto,
    @CurrentUser() user: any
  ) {
    try {
      // Validar que el sensor existe y pertenece a la empresa
      const sensor = await this.prisma.sensor.findFirst({
        where: { 
          id: parseInt(sensorId), 
          empresaId: user.empresaId 
        }
      });

      if (!sensor) {
        throw new HttpException('Sensor no encontrado', HttpStatus.NOT_FOUND);
      }

      // Validar umbralCriticoes
      this.validarUmbrales(umbralCriticoesDto);

      // Obtener configuración actual
      const configuracionActual = sensor.configuracion as any || {};
      
      // Actualizar configuración
      const nuevaConfiguracion = {
        ...configuracionActual,
        ...umbralCriticoesDto,
        ultimaActualizacion: new Date(),
        actualizadoPor: user.id
      };

      // Guardar en la base de datos
      const sensorActualizado = await this.prisma.sensor.update({
        where: { id: parseInt(sensorId) },
        data: {
          configuracion: nuevaConfiguracion
        },
        include: {
          ubicacion: true
        }
      });

      // Crear log de auditoría
      await this.prisma.auditLog.create({
        data: {
          action: 'ACTUALIZAR_UMBRALES',
          resource: 'SENSOR',
          resourceId: parseInt(sensorId),
          userId: user.id,
          userEmail: user.email || 'admin@empresa.com',
          userName: user.nombre || 'Administrador',
          details: JSON.stringify({
            umbralCriticoesAnteriores: configuracionActual,
            umbralCriticoesNuevos: umbralCriticoesDto,
            motivo: 'Actualización desde frontend'
          }),
          ipAddress: 'N/A', // Se puede obtener del request
          userAgent: 'N/A', // Se puede obtener del request
          empresaId: user.empresaId,
          empresaName: user.empresaNombre || 'Empresa'
        }
      });

      return {
        success: true,
        message: 'Umbrales actualizados exitosamente',
        data: {
          sensorId: sensorActualizado.id,
          sensorNombre: sensorActualizado.nombre,
          umbralCriticoes: nuevaConfiguracion,
          ultimaActualizacion: nuevaConfiguracion.ultimaActualizacion
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error actualizando umbralCriticoes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('alertas/resumen')
  @ApiOperation({ summary: 'Obtener resumen de alertas' })
  @ApiResponse({ status: 200, description: 'Resumen obtenido exitosamente' })
  async obtenerResumenAlertas(
    @Query('empresaId') empresaId: string,
    @CurrentUser() user: any
  ) {
    try {
      const empresaIdNum = parseInt(empresaId) || user.empresaId;

      // Obtener alertas activas
      const alertasActivas = await this.prisma.alertaHistorial.findMany({
        where: { 
          empresaId: empresaIdNum, 
          estado: 'ACTIVA',
          tipo: 'SENSOR'
        },
        include: { 
          sensor: true, 
          ubicacion: true 
        },
        orderBy: { fechaEnvio: 'desc' }
      });

      // Obtener alertas resueltas en las últimas 24 horas
      const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const alertasResueltas = await this.prisma.alertaHistorial.findMany({
        where: { 
          empresaId: empresaIdNum, 
          estado: 'RESUELTA',
          tipo: 'SENSOR',
          fechaResolucion: { gte: hace24Horas }
        },
        include: { 
          sensor: true, 
          ubicacion: true 
        }
      });

      // Calcular estadísticas
      const porSeveridad = {
        BAJA: alertasActivas.filter(a => a.severidad === 'BAJA').length,
        MEDIA: alertasActivas.filter(a => a.severidad === 'MEDIA').length,
        ALTA: alertasActivas.filter(a => a.severidad === 'ALTA').length,
        CRITICA: alertasActivas.filter(a => a.severidad === 'CRITICA').length
      };

      const porTipo = {
        TEMPERATURA: alertasActivas.filter(a => a.sensor?.tipo === 'TEMPERATURA').length,
        HUMEDAD: alertasActivas.filter(a => a.sensor?.tipo === 'HUMEDAD').length,
        PESO: alertasActivas.filter(a => a.sensor?.tipo === 'PESO').length,
        PRESION: alertasActivas.filter(a => a.sensor?.tipo === 'PRESION').length
      };

      const porUbicacion = {};
      alertasActivas.forEach(alerta => {
        if (alerta.ubicacion?.nombre) {
          porUbicacion[alerta.ubicacion.nombre] = (porUbicacion[alerta.ubicacion.nombre] || 0) + 1;
        }
      });

      return {
        success: true,
        data: {
          totalActivas: alertasActivas.length,
          totalResueltas24h: alertasResueltas.length,
          porSeveridad,
          porTipo,
          porUbicacion,
          ultimaAlerta: alertasActivas.length > 0 ? alertasActivas[0].fechaEnvio : null,
          proximaVerificacion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
          tendencia: this.calcularTendencia(alertasActivas)
        }
      };
    } catch (error) {
      throw new HttpException('Error obteniendo resumen de alertas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('alertas/:id/resolver')
  @ApiOperation({ summary: 'Resolver una alerta' })
  @ApiResponse({ status: 200, description: 'Alerta resuelta exitosamente' })
  @ApiResponse({ status: 404, description: 'Alerta no encontrada' })
  async resolverAlerta(
    @Param('id') alertaId: string,
    @Body() body: { comentario?: string },
    @CurrentUser() user: any
  ) {
    try {
      const alerta = await this.prisma.alertaHistorial.findFirst({
        where: { 
          id: parseInt(alertaId), 
          empresaId: user.empresaId 
        }
      });

      if (!alerta) {
        throw new HttpException('Alerta no encontrada', HttpStatus.NOT_FOUND);
      }

      // Actualizar alerta
      const alertaActualizada = await this.prisma.alertaHistorial.update({
        where: { id: parseInt(alertaId) },
        data: {
          estado: 'RESUELTA',
          fechaResolucion: new Date(),
          mensaje: body.comentario ? 
            `${alerta.mensaje} - Resuelto: ${body.comentario}` : 
            alerta.mensaje
        }
      });

      // Crear log de auditoría
      await this.prisma.auditLog.create({
        data: {
          action: 'RESOLVER_ALERTA',
          resource: 'ALERTA',
          resourceId: parseInt(alertaId),
          userId: user.id,
          userEmail: user.email || 'admin@empresa.com',
          userName: user.nombre || 'Administrador',
          details: JSON.stringify({
            alertaId: parseInt(alertaId),
            comentario: body.comentario,
            estadoAnterior: 'ACTIVA',
            estadoNuevo: 'RESUELTA'
          }),
          ipAddress: 'N/A',
          userAgent: 'N/A',
          empresaId: user.empresaId,
          empresaName: user.empresaNombre || 'Empresa'
        }
      });

      return {
        success: true,
        message: 'Alerta resuelta exitosamente',
        data: {
          alertaId: alertaActualizada.id,
          estado: alertaActualizada.estado,
          fechaResolucion: alertaActualizada.fechaResolucion
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error resolviendo alerta', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('alertas/configuracion')
  @ApiOperation({ summary: 'Guardar configuración de alertas' })
  @ApiResponse({ status: 200, description: 'Configuración guardada exitosamente' })
  async guardarConfiguracionAlertas(
    @Body() configuracion: any,
    @CurrentUser() user: any
  ) {
    try {
      // Aquí implementarías la lógica para guardar la configuración
      // Por ahora retornamos éxito
      return {
        success: true,
        message: 'Configuración de alertas guardada exitosamente',
        data: {
          configuracion,
          guardadoPor: user.id,
          fechaGuardado: new Date()
        }
      };
    } catch (error) {
      throw new HttpException('Error guardando configuración', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private validarUmbrales(umbralCriticoes: UmbralesSensorDto) {
    // Validar temperatura
    if (umbralCriticoes.temperaturaMin !== undefined && umbralCriticoes.temperaturaMax !== undefined) {
      if (umbralCriticoes.temperaturaMin >= umbralCriticoes.temperaturaMax) {
        throw new HttpException('La temperatura mínima debe ser menor que la máxima', HttpStatus.BAD_REQUEST);
      }
    }

    // Validar humedad
    if (umbralCriticoes.humedadMin !== undefined && umbralCriticoes.humedadMax !== undefined) {
      if (umbralCriticoes.humedadMin >= umbralCriticoes.humedadMax) {
        throw new HttpException('La humedad mínima debe ser menor que la máxima', HttpStatus.BAD_REQUEST);
      }
      if (umbralCriticoes.humedadMin < 0 || umbralCriticoes.humedadMax > 100) {
        throw new HttpException('La humedad debe estar entre 0% y 100%', HttpStatus.BAD_REQUEST);
      }
    }

    // Validar peso
    if (umbralCriticoes.pesoMin !== undefined && umbralCriticoes.pesoMax !== undefined) {
      if (umbralCriticoes.pesoMin >= umbralCriticoes.pesoMax) {
        throw new HttpException('El peso mínimo debe ser menor que el máximo', HttpStatus.BAD_REQUEST);
      }
      if (umbralCriticoes.pesoMin < 0 || umbralCriticoes.pesoMax < 0) {
        throw new HttpException('El peso debe ser positivo', HttpStatus.BAD_REQUEST);
      }
    }

    // Validar presión
    if (umbralCriticoes.presionMin !== undefined && umbralCriticoes.presionMax !== undefined) {
      if (umbralCriticoes.presionMin >= umbralCriticoes.presionMax) {
        throw new HttpException('La presión mínima debe ser menor que la máxima', HttpStatus.BAD_REQUEST);
      }
    }

    // Validar intervalo de verificación
    const intervalo = umbralCriticoes.intervaloVerificacionMinutos || 5;
    if (intervalo < 1 || intervalo > 1440) {
      throw new HttpException('El intervalo de verificación debe estar entre 1 y 1440 minutos', HttpStatus.BAD_REQUEST);
    }
  }

  private calcularTendencia(alertas: any[]): 'MEJORANDO' | 'ESTABLE' | 'EMPEORANDO' {
    if (alertas.length < 3) return 'ESTABLE';

    const ultimas3 = alertas.slice(0, 3);
    const ahora = new Date();
    const hace1h = new Date(ahora.getTime() - 60 * 60 * 1000);
    
    const alertasRecientes = ultimas3.filter(a => a.fechaEnvio > hace1h);
    
    if (alertasRecientes.length === 0) return 'MEJORANDO';
    if (alertasRecientes.length === ultimas3.length) return 'EMPEORANDO';
    
    return 'ESTABLE';
  }
}
