import { Injectable, Logger } from '@nestjs/common';
import { CreateSensorLecturaDto, TipoSensor } from './dto/create-sensor-lectura.dto';
import { CreateSensorDto, CreateSensorSimpleDto, SensorConfiguracion, CONFIGURACIONES_PREDEFINIDAS } from './dto/create-sensor.dto';
export { TipoSensor };
import { PrismaService } from '../prisma/prisma.service';
import { SensorTipo, Sensor, SensorLectura } from '@prisma/client';
import { AlertasAvanzadasService } from '../alertas/alertas-avanzadas.service';
import { SensoresGateway } from '../websockets/sensores/sensores.gateway';

export interface SensorData {
  id: number;
  tipo: SensorTipo;
  valor: number;
  unidad: string;
  productoId?: number;
  productoNombre?: string;
  fecha: Date;
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO';
  mensaje?: string;
}

export interface SensorAnalytics {
  totalLecturas: number;
  lecturasUltimas24h: number;
  alertasActivas: number;
  productosMonitoreados: number;
  temperaturaPromedio: number;
  humedadPromedio: number;
  tendenciaTemperatura: 'ESTABLE' | 'CRECIENTE' | 'DECRECIENTE';
  tendenciaHumedad: 'ESTABLE' | 'CRECIENTE' | 'DECRECIENTE';
}

export interface SensorAlert {
  id: string;
  tipo: SensorTipo;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  mensaje: string;
  productoId?: number;
  productoNombre?: string;
  valor: number;
  limite: number;
  fecha: Date;
  resuelto: boolean;
}

export interface SensorWithLocation extends Sensor {
  ubicacion: {
    id: number;
    nombre: string;
  };
}

export interface SensorWithReadings extends Sensor {
  ubicacion: {
    id: number;
    nombre: string;
  };
  lecturas: SensorLectura[];
}

export interface SensorWithCount extends Sensor {
  ubicacion: {
    id: number;
    nombre: string;
  };
  _count: {
    lecturas: number;
  };
}

@Injectable()
export class SensoresService {
  private readonly logger = new Logger(SensoresService.name);

  constructor(
    private prisma: PrismaService,
    private alertasAvanzadasService: AlertasAvanzadasService,
    private sensoresGateway: SensoresGateway,
  ) {}

  async registrarLectura(dto: CreateSensorLecturaDto, empresaId: number): Promise<SensorData> {
    try {
      // Validar que el producto pertenece a la empresa si se especifica
      if (dto.productoId) {
        const producto = await this.prisma.producto.findFirst({
          where: { id: dto.productoId, empresaId },
        });
        if (!producto) {
          throw new Error('Producto no encontrado o no pertenece a la empresa');
        }
      }

      // Validar que el sensor pertenece a la empresa si se especifica
      if (dto.sensorId) {
        const sensor = await this.prisma.sensor.findFirst({
          where: { id: dto.sensorId, empresaId, activo: true },
        });
        if (!sensor) {
          throw new Error('Sensor no encontrado o no pertenece a la empresa');
        }
      }

      // Validar que la ubicación pertenece a la empresa si se especifica
      if (dto.ubicacionId) {
        const ubicacion = await this.prisma.ubicacion.findFirst({
          where: { id: dto.ubicacionId, empresaId, activa: true },
        });
        if (!ubicacion) {
          throw new Error('Ubicación no encontrada o no pertenece a la empresa');
        }
      }

      // Convertir TipoSensor a SensorTipo
      const sensorTipo = this.convertTipoSensor(dto.tipo);

      const data: {
        tipo: SensorTipo;
        valor: number;
        unidad: string;
        empresaId: number;
        productoId?: number;
        sensorId?: number;
        ubicacionId?: number;
      } = {
        tipo: sensorTipo,
        valor: dto.valor,
        unidad: dto.unidad,
        empresaId,
      };

      if (dto.productoId) {
        data.productoId = dto.productoId;
      }

      if (dto.sensorId) {
        data.sensorId = dto.sensorId;
      }

      if (dto.ubicacionId) {
        data.ubicacionId = dto.ubicacionId;
      }

      const lectura = await this.prisma.sensorLectura.create({ data });

      // Analizar la lectura y determinar estado
      const estado = this.analizarLectura(sensorTipo, dto.valor);
      const mensaje = this.generarMensaje(sensorTipo, dto.valor, estado);

      // Si hay alerta, registrarla
      if (estado !== 'NORMAL') {
        await this.registrarAlerta(dto, estado, empresaId);
      }

      // Verificar alertas avanzadas
      await this.verificarAlertasAvanzadas(lectura, empresaId);

      // Emitir por WebSocket
      await this.emitirLecturaPorWebSocket(lectura, empresaId);

      // Actualizar inventario si es sensor de peso
      if (dto.tipo === TipoSensor.PESO && dto.productoId) {
        await this.actualizarInventarioPorPeso(dto.productoId, dto.valor, empresaId);
      }

      const producto = dto.productoId ? await this.prisma.producto.findUnique({
        where: { id: dto.productoId },
        select: { nombre: true }
      }) : null;

      return {
        id: lectura.id,
        tipo: lectura.tipo,
        valor: lectura.valor,
        unidad: lectura.unidad,
        productoId: lectura.productoId || undefined,
        productoNombre: producto?.nombre,
        fecha: lectura.fecha,
        estado,
        mensaje,
      };
    } catch (error) {
      this.logger.error('Error registrando lectura de sensor:', error);
      throw error;
    }
  }

  async obtenerLecturas(empresaId: number, filtros?: {
    tipo?: SensorTipo;
    productoId?: number;
    desde?: Date;
    hasta?: Date;
    limite?: number;
  }): Promise<SensorData[]> {
    try {
      const where: any = {
        producto: {
          empresaId,
        },
      };

      if (filtros?.tipo) where.tipo = filtros.tipo;
      if (filtros?.productoId) where.productoId = filtros.productoId;
      if (filtros?.desde) where.fecha = { gte: filtros.desde };
      if (filtros?.hasta) where.fecha = { ...where.fecha, lte: filtros.hasta };

      const lecturas = await this.prisma.sensorLectura.findMany({
        where,
        include: {
          producto: {
            select: { nombre: true }
          }
        },
        orderBy: { fecha: 'desc' },
        take: filtros?.limite || 100,
      });

      return lecturas.map(lectura => {
        const estado = this.analizarLectura(lectura.tipo, lectura.valor);
        const mensaje = this.generarMensaje(lectura.tipo, lectura.valor, estado);

        return {
          id: lectura.id,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          productoId: lectura.productoId || undefined,
          productoNombre: lectura.producto?.nombre,
          fecha: lectura.fecha,
          estado,
          mensaje,
        };
      });
    } catch (error) {
      this.logger.error('Error obteniendo lecturas de sensores:', error);
      throw error;
    }
  }

  async obtenerAnalytics(empresaId: number): Promise<SensorAnalytics> {
    try {
      const ahora = new Date();
      const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
      const hace48h = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);

      const [
        totalLecturas,
        lecturas24h,
        productosMonitoreados,
        temperatura24h,
        humedad24h,
        temperatura48h,
        humedad48h,
      ] = await Promise.all([
        this.prisma.sensorLectura.count({
          where: { producto: { empresaId } }
        }),
        this.prisma.sensorLectura.count({
          where: { 
            producto: { empresaId },
            fecha: { gte: hace24h }
          }
        }),
        this.prisma.producto.count({
          where: { 
            empresaId,
            sensores: { some: {} }
          }
        }),
        this.prisma.sensorLectura.findMany({
          where: {
            producto: { empresaId },
            tipo: 'TEMPERATURA',
            fecha: { gte: hace24h }
          },
          select: { valor: true }
        }),
        this.prisma.sensorLectura.findMany({
          where: {
            producto: { empresaId },
            tipo: 'HUMEDAD',
            fecha: { gte: hace24h }
          },
          select: { valor: true }
        }),
        this.prisma.sensorLectura.findMany({
          where: {
            producto: { empresaId },
            tipo: 'TEMPERATURA',
            fecha: { gte: hace48h, lt: hace24h }
          },
          select: { valor: true }
        }),
        this.prisma.sensorLectura.findMany({
          where: {
            producto: { empresaId },
            tipo: 'HUMEDAD',
            fecha: { gte: hace48h, lt: hace24h }
          },
          select: { valor: true }
        }),
      ]);

      const temperaturaPromedio = temperatura24h.length > 0 
        ? temperatura24h.reduce((sum, l) => sum + l.valor, 0) / temperatura24h.length 
        : 0;

      const humedadPromedio = humedad24h.length > 0 
        ? humedad24h.reduce((sum, l) => sum + l.valor, 0) / humedad24h.length 
        : 0;

      const tendenciaTemperatura = this.calcularTendencia(
        temperatura24h.map(l => l.valor),
        temperatura48h.map(l => l.valor)
      );

      const tendenciaHumedad = this.calcularTendencia(
        humedad24h.map(l => l.valor),
        humedad48h.map(l => l.valor)
      );

      // Contar alertas activas (simulado por ahora)
      const alertasActivas = await this.contarAlertasActivas(empresaId);

      return {
        totalLecturas,
        lecturasUltimas24h: lecturas24h,
        alertasActivas,
        productosMonitoreados,
        temperaturaPromedio: Math.round(temperaturaPromedio * 10) / 10,
        humedadPromedio: Math.round(humedadPromedio * 10) / 10,
        tendenciaTemperatura,
        tendenciaHumedad,
      };
    } catch (error) {
      this.logger.error('Error obteniendo analytics de sensores:', error);
      throw error;
    }
  }

  async obtenerAlertas(empresaId: number): Promise<SensorAlert[]> {
    try {
      const lecturas = await this.prisma.sensorLectura.findMany({
        where: {
          producto: { empresaId },
          fecha: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24h
        },
        include: {
          producto: { select: { nombre: true } }
        },
        orderBy: { fecha: 'desc' }
      });

      const alertas: SensorAlert[] = [];

      lecturas.forEach(lectura => {
        const estado = this.analizarLectura(lectura.tipo, lectura.valor);
        if (estado !== 'NORMAL') {
          const alerta = this.crearAlerta(lectura, estado);
          alertas.push(alerta);
        }
      });

      return alertas;
    } catch (error) {
      this.logger.error('Error obteniendo alertas de sensores:', error);
      throw error;
    }
  }

  async simularLectura(empresaId: number, productoId?: number): Promise<SensorData> {
    try {
      // Simular lectura de temperatura o humedad
      const tipos = ['TEMPERATURA', 'HUMEDAD', 'PESO'] as SensorTipo[];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      
      let valor: number;
      let unidad: string;
      let limite: number;

      switch (tipo) {
        case 'TEMPERATURA':
          valor = Math.random() * 40 + 10; // 10-50°C
          unidad = '°C';
          limite = 35;
          break;
        case 'HUMEDAD':
          valor = Math.random() * 100; // 0-100%
          unidad = '%';
          limite = 80;
          break;
        case 'PESO':
          valor = Math.random() * 1000 + 100; // 100-1100g
          unidad = 'g';
          limite = 500;
          break;
        default:
          valor = Math.random() * 100;
          unidad = 'unidades';
          limite = 50;
      }

      const dto: CreateSensorLecturaDto = {
        tipo: this.convertSensorTipoToTipoSensor(tipo),
        valor: Math.round(valor * 10) / 10,
        unidad,
        productoId,
      };

      return this.registrarLectura(dto, empresaId);
    } catch (error) {
      this.logger.error('Error simulando lectura de sensor:', error);
      throw error;
    }
  }

  private convertTipoSensor(tipoSensor: TipoSensor): SensorTipo {
    switch (tipoSensor) {
      case TipoSensor.TEMPERATURA:
        return 'TEMPERATURA';
      case TipoSensor.HUMEDAD:
        return 'HUMEDAD';
      case TipoSensor.PESO:
        return 'PESO';
      case TipoSensor.RFID:
        return 'PRESION'; // Mapear RFID a PRESION ya que RFID no existe en SensorTipo
      default:
        return 'TEMPERATURA';
    }
  }

  private convertSensorTipoToTipoSensor(sensorTipo: SensorTipo): TipoSensor {
    switch (sensorTipo) {
      case 'TEMPERATURA':
        return TipoSensor.TEMPERATURA;
      case 'HUMEDAD':
        return TipoSensor.HUMEDAD;
      case 'PESO':
        return TipoSensor.PESO;
      case 'PRESION':
        return TipoSensor.RFID; // Mapear PRESION a RFID
      default:
        return TipoSensor.TEMPERATURA;
    }
  }

  private analizarLectura(tipo: SensorTipo, valor: number): 'NORMAL' | 'ALERTA' | 'CRITICO' {
    switch (tipo) {
      case 'TEMPERATURA':
        if (valor > 40) return 'CRITICO';
        if (valor > 30) return 'ALERTA';
        return 'NORMAL';
      case 'HUMEDAD':
        if (valor > 90) return 'CRITICO';
        if (valor > 80) return 'ALERTA';
        return 'NORMAL';
      case 'PESO':
        if (valor < 50) return 'CRITICO';
        if (valor < 100) return 'ALERTA';
        return 'NORMAL';
      case 'PRESION':
        if (valor > 1500) return 'CRITICO';
        if (valor > 1200) return 'ALERTA';
        return 'NORMAL';
      default:
        return 'NORMAL';
    }
  }

  private generarMensaje(tipo: SensorTipo, valor: number, estado: string): string {
    if (estado === 'NORMAL') return 'Valor dentro del rango normal';

    switch (tipo) {
      case 'TEMPERATURA':
        return estado === 'CRITICO' 
          ? `¡Temperatura crítica: ${valor}°C!` 
          : `Temperatura alta: ${valor}°C`;
      case 'HUMEDAD':
        return estado === 'CRITICO' 
          ? `¡Humedad crítica: ${valor}%!` 
          : `Humedad alta: ${valor}%`;
      case 'PESO':
        return estado === 'CRITICO' 
          ? `¡Peso crítico: ${valor}g!` 
          : `Peso bajo: ${valor}g`;
      default:
        return `Valor anormal: ${valor}`;
    }
  }

  private async registrarAlerta(dto: CreateSensorLecturaDto, estado: string, empresaId: number): Promise<void> {
    // Por ahora solo log, en el futuro se podría guardar en una tabla de alertas
    this.logger.warn(`Alerta de sensor: ${dto.tipo} = ${dto.valor}${dto.unidad} (${estado})`);
  }

  private async verificarAlertasAvanzadas(lectura: SensorLectura, empresaId: number): Promise<void> {
    try {
      // Comentado temporalmente hasta que se implemente el método correcto
      // await this.alertasAvanzadasService.verificarAlertasSensor(lectura, empresaId);
      this.logger.log(`Verificando alertas avanzadas para lectura ${lectura.id}`);
    } catch (error) {
      this.logger.error('Error verificando alertas avanzadas:', error);
    }
  }

  private async emitirLecturaPorWebSocket(lectura: SensorLectura, empresaId: number): Promise<void> {
    try {
      if (this.sensoresGateway) {
        this.sensoresGateway.server.to(`empresa_${empresaId}`).emit('nueva_lectura', {
          lectura: {
            id: lectura.id,
            tipo: lectura.tipo,
            valor: lectura.valor,
            unidad: lectura.unidad,
            fecha: lectura.fecha,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error('Error emitiendo lectura por WebSocket:', error);
    }
  }

  private async actualizarInventarioPorPeso(productoId: number, peso: number, empresaId: number): Promise<void> {
    try {
      // Convertir peso a unidades (asumiendo que 1 unidad = 100g)
      const unidades = Math.floor(peso / 100);
      
      await this.prisma.producto.update({
        where: { id: productoId, empresaId },
        data: { stock: unidades }
      });

      this.logger.log(`Inventario actualizado por peso: Producto ${productoId} = ${unidades} unidades`);
    } catch (error) {
      this.logger.error('Error actualizando inventario por peso:', error);
    }
  }

  private calcularTendencia(valoresActuales: number[], valoresAnteriores: number[]): 'ESTABLE' | 'CRECIENTE' | 'DECRECIENTE' {
    if (valoresActuales.length === 0 || valoresAnteriores.length === 0) return 'ESTABLE';

    const promedioActual = valoresActuales.reduce((sum, val) => sum + val, 0) / valoresActuales.length;
    const promedioAnterior = valoresAnteriores.reduce((sum, val) => sum + val, 0) / valoresAnteriores.length;

    const diferencia = ((promedioActual - promedioAnterior) / promedioAnterior) * 100;

    if (Math.abs(diferencia) < 5) return 'ESTABLE';
    return diferencia > 0 ? 'CRECIENTE' : 'DECRECIENTE';
  }

  private async contarAlertasActivas(empresaId: number): Promise<number> {
    // Simulado por ahora
    return Math.floor(Math.random() * 5);
  }

  private crearAlerta(lectura: SensorLectura, estado: string): SensorAlert {
    const limite = this.obtenerLimite(lectura.tipo);
    const severidad = estado === 'CRITICO' ? 'CRITICA' : estado === 'ALERTA' ? 'ALTA' : 'MEDIA';

    return {
      id: `alert_${lectura.id}_${Date.now()}`,
      tipo: lectura.tipo,
      severidad,
      mensaje: this.generarMensaje(lectura.tipo, lectura.valor, estado),
      valor: lectura.valor,
      limite,
      fecha: lectura.fecha,
      resuelto: false,
    };
  }

  private obtenerLimite(tipo: SensorTipo): number {
    switch (tipo) {
      case 'TEMPERATURA': return 30;
      case 'HUMEDAD': return 80;
      case 'PESO': return 100;
      case 'PRESION': return 1200;
      default: return 50;
    }
  }

  // Método mejorado para registro de sensor con configuración automática
  async registrarSensor(dto: CreateSensorDto, empresaId: number): Promise<SensorWithLocation> {
    try {
      // Validar que la empresa existe
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Validar que la ubicación pertenece a la empresa
      const ubicacion = await this.prisma.ubicacion.findFirst({
        where: { id: dto.ubicacionId, empresaId, activa: true },
      });
      if (!ubicacion) {
        throw new Error('Ubicación no encontrada o no pertenece a la empresa');
      }

      // Validar que no existe un sensor con el mismo nombre en la misma ubicación
      const sensorExistente = await this.prisma.sensor.findFirst({
        where: {
          nombre: dto.nombre,
          ubicacionId: dto.ubicacionId,
          empresaId,
          activo: true,
        },
      });
      if (sensorExistente) {
        throw new Error('Ya existe un sensor con ese nombre en esta ubicación');
      }

      // Aplicar configuración predefinida si no se proporciona
      let configuracionFinal = dto.configuracion;
      if (!configuracionFinal) {
        configuracionFinal = CONFIGURACIONES_PREDEFINIDAS[dto.tipo];
        this.logger.log(`Aplicando configuración predefinida para sensor tipo ${dto.tipo}`);
      } else {
        // Combinar configuración personalizada con predefinida
        configuracionFinal = {
          ...CONFIGURACIONES_PREDEFINIDAS[dto.tipo],
          ...configuracionFinal
        };
      }

      // Validar configuración del sensor según el tipo
      this.validarConfiguracionSensor(dto.tipo, configuracionFinal);

      const sensor = await this.prisma.sensor.create({
        data: {
          nombre: dto.nombre,
          tipo: dto.tipo,
          ubicacionId: dto.ubicacionId,
          empresaId,
          activo: dto.activo ?? true,
          configuracion: JSON.parse(JSON.stringify(configuracionFinal)),
        },
        include: {
          ubicacion: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      this.logger.log(`Sensor registrado: ${sensor.nombre} (ID: ${sensor.id}) en ubicación ${ubicacion.nombre}`);
      
      // Emitir evento por WebSocket si está disponible
      try {
        await this.emitirSensorRegistradoPorWebSocket(sensor, empresaId);
      } catch (wsError) {
        this.logger.warn('Error emitiendo evento WebSocket:', wsError);
      }

      return sensor;
    } catch (error) {
      this.logger.error('Error registrando sensor:', error);
      throw error;
    }
  }

  // Método simplificado para registro rápido de sensor
  async registrarSensorSimple(dto: CreateSensorSimpleDto, empresaId: number): Promise<SensorWithLocation> {
    try {
      // Convertir DTO simple a DTO completo con configuración automática
      const dtoCompleto: CreateSensorDto = {
        ...dto,
        activo: true,
        configuracion: CONFIGURACIONES_PREDEFINIDAS[dto.tipo],
        modo: 'AUTOMATICO'
      };

      return await this.registrarSensor(dtoCompleto, empresaId);
    } catch (error) {
      this.logger.error('Error registrando sensor simple:', error);
      throw error;
    }
  }

  // Método para obtener configuraciones predefinidas
  obtenerConfiguracionesPredefinidas(): Record<SensorTipo, SensorConfiguracion> {
    return CONFIGURACIONES_PREDEFINIDAS;
  }

  // Método para obtener configuración específica por tipo
  obtenerConfiguracionPorTipo(tipo: SensorTipo): SensorConfiguracion {
    return CONFIGURACIONES_PREDEFINIDAS[tipo];
  }

  private validarConfiguracionSensor(tipo: SensorTipo, configuracion: SensorConfiguracion): void {
    switch (tipo) {
      case 'TEMPERATURA':
        if (configuracion.rango_min !== undefined && configuracion.rango_max !== undefined) {
          if (configuracion.rango_min >= configuracion.rango_max) {
            throw new Error('El rango mínimo debe ser menor al rango máximo para sensores de temperatura');
          }
        }
        break;
      case 'HUMEDAD':
        if (configuracion.rango_min !== undefined && configuracion.rango_max !== undefined) {
          if (configuracion.rango_min < 0 || configuracion.rango_max > 100) {
            throw new Error('El rango de humedad debe estar entre 0 y 100');
          }
        }
        break;
      case 'PESO':
        if (configuracion.rango_min !== undefined && configuracion.rango_min < 0) {
          throw new Error('El peso mínimo no puede ser negativo');
        }
        break;
      case 'PRESION':
        if (configuracion.rango_min !== undefined && configuracion.rango_min < 0) {
          throw new Error('La presión mínima no puede ser negativa');
        }
        break;
    }
  }

  private async emitirSensorRegistradoPorWebSocket(sensor: SensorWithLocation, empresaId: number): Promise<void> {
    if (this.sensoresGateway) {
      this.sensoresGateway.server.to(`empresa_${empresaId}`).emit('sensor_registrado', {
        sensor: {
          id: sensor.id,
          nombre: sensor.nombre,
          tipo: sensor.tipo,
          ubicacionId: sensor.ubicacionId,
          activo: sensor.activo,
          createdAt: sensor.createdAt,
        },
        ubicacion: sensor.ubicacion,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async obtenerSensores(empresaId: number, ubicacionId?: number): Promise<SensorWithCount[]> {
    try {
      const where: {
        empresaId: number;
        activo: boolean;
        ubicacionId?: number;
      } = {
        empresaId,
        activo: true,
      };

      if (ubicacionId) {
        where.ubicacionId = ubicacionId;
      }

      const sensores = await this.prisma.sensor.findMany({
        where,
        include: {
          ubicacion: {
            select: {
              id: true,
              nombre: true,
            },
          },
          _count: {
            select: {
              lecturas: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return sensores;
    } catch (error) {
      this.logger.error('Error obteniendo sensores:', error);
      throw error;
    }
  }

  async obtenerSensor(id: number, empresaId: number): Promise<SensorWithReadings> {
    try {
      const sensor = await this.prisma.sensor.findFirst({
        where: {
          id,
          empresaId,
          activo: true,
        },
        include: {
          ubicacion: {
            select: {
              id: true,
              nombre: true,
            },
          },
          lecturas: {
            take: 10,
            orderBy: {
              fecha: 'desc',
            },
          },
        },
      });

      if (!sensor) {
        throw new Error('Sensor no encontrado');
      }

      return sensor;
    } catch (error) {
      this.logger.error('Error obteniendo sensor:', error);
      throw error;
    }
  }

  async actualizarSensor(id: number, dto: Partial<CreateSensorDto>, empresaId: number): Promise<SensorWithLocation> {
    try {
      // Verificar que el sensor existe y pertenece a la empresa
      const sensorExistente = await this.prisma.sensor.findFirst({
        where: {
          id,
          empresaId,
          activo: true,
        },
      });

      if (!sensorExistente) {
        throw new Error('Sensor no encontrado');
      }

      // Validar ubicación si se está actualizando
      if (dto.ubicacionId) {
        const ubicacion = await this.prisma.ubicacion.findFirst({
          where: { id: dto.ubicacionId, empresaId, activa: true },
        });
        if (!ubicacion) {
          throw new Error('Ubicación no encontrada o no pertenece a la empresa');
        }
      }

      // Validar nombre único si se está actualizando
      if (dto.nombre && dto.nombre !== sensorExistente.nombre) {
        const sensorConMismoNombre = await this.prisma.sensor.findFirst({
          where: {
            nombre: dto.nombre,
            ubicacionId: dto.ubicacionId || sensorExistente.ubicacionId,
            empresaId,
            activo: true,
            id: { not: id },
          },
        });
        if (sensorConMismoNombre) {
          throw new Error('Ya existe un sensor con ese nombre en esta ubicación');
        }
      }

      // Validar configuración si se está actualizando
      if (dto.configuracion) {
        this.validarConfiguracionSensor(dto.tipo || sensorExistente.tipo, dto.configuracion);
      }

      const sensor = await this.prisma.sensor.update({
        where: { id },
        data: {
          ...dto,
          configuracion: dto.configuracion ? JSON.parse(JSON.stringify(dto.configuracion)) : undefined,
        },
        include: {
          ubicacion: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      this.logger.log(`Sensor actualizado: ${sensor.nombre} (ID: ${sensor.id})`);
      return sensor;
    } catch (error) {
      this.logger.error('Error actualizando sensor:', error);
      throw error;
    }
  }

  async eliminarSensor(id: number, empresaId: number) {
    try {
      // Verificar que el sensor existe y pertenece a la empresa
      const sensorExistente = await this.prisma.sensor.findFirst({
        where: {
          id,
          empresaId,
          activo: true,
        },
      });

      if (!sensorExistente) {
        throw new Error('Sensor no encontrado');
      }

      // Soft delete - marcar como inactivo
      const sensor = await this.prisma.sensor.update({
        where: { id },
        data: { activo: false },
      });

      this.logger.log(`Sensor eliminado: ${sensor.nombre}`);
      return { message: 'Sensor eliminado correctamente' };
    } catch (error) {
      this.logger.error(`Error eliminando sensor ${id}:`, error);
      throw error;
    }
  }

  // Métodos del Dashboard
  async obtenerDashboardUbicaciones(empresaId: number) {
    try {
      const ubicaciones = await this.prisma.ubicacion.findMany({
        where: {
          empresaId,
          activa: true,
        },
        include: {
          sensores: {
            where: {
              activo: true,
            },
            include: {
              lecturas: {
                take: 1,
                orderBy: {
                  fecha: 'desc',
                },
              },
            },
          },
          _count: {
            select: {
              sensores: true,
              lecturas: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const dashboardData = await Promise.all(
        ubicaciones.map(async (ubicacion) => {
          // Obtener estadísticas de sensores por tipo
          const sensoresPorTipo = await this.prisma.sensor.groupBy({
            by: ['tipo'],
            where: {
              ubicacionId: ubicacion.id,
              activo: true,
            },
            _count: {
              id: true,
            },
          });

          // Obtener lecturas de las últimas 24 horas
          const fecha24hAtras = new Date();
          fecha24hAtras.setHours(fecha24hAtras.getHours() - 24);

          const lecturasUltimas24h = await this.prisma.sensorLectura.count({
            where: {
              ubicacionId: ubicacion.id,
              fecha: {
                gte: fecha24hAtras,
              },
            },
          });

          // Obtener alertas activas
          const alertasActivas = await this.prisma.alertHistory.count({
            where: {
              empresaId,
              estado: 'ENVIADA',
            },
          });

          return {
            ubicacion: {
              id: ubicacion.id,
              nombre: ubicacion.nombre,
              descripcion: ubicacion.descripcion,
            },
            estadisticas: {
              totalSensores: ubicacion._count.sensores,
              sensoresActivos: ubicacion.sensores.length,
              lecturasUltimas24h,
              alertasActivas,
              sensoresPorTipo: sensoresPorTipo.map((item) => ({
                tipo: item.tipo,
                cantidad: item._count.id,
              })),
            },
            sensores: ubicacion.sensores.map((sensor) => ({
              id: sensor.id,
              nombre: sensor.nombre,
              tipo: sensor.tipo,
              activo: sensor.activo,
              ultimaLectura: sensor.lecturas[0] ? {
                valor: sensor.lecturas[0].valor,
                unidad: sensor.lecturas[0].unidad,
                fecha: sensor.lecturas[0].fecha,
                estado: this.analizarLectura(sensor.lecturas[0].tipo, sensor.lecturas[0].valor),
              } : undefined,
            })),
          };
        })
      );

      return dashboardData;
    } catch (error) {
      this.logger.error('Error obteniendo dashboard de ubicaciones:', error);
      throw error;
    }
  }

  async obtenerDashboardTiempoReal(ubicacionId: number, empresaId: number, opciones?: {
    desde?: Date;
    hasta?: Date;
    limite?: number;
  }) {
    try {
      // Verificar que la ubicación pertenece a la empresa
      const ubicacion = await this.prisma.ubicacion.findFirst({
        where: {
          id: ubicacionId,
          empresaId,
          activa: true,
        },
      });

      if (!ubicacion) {
        throw new Error('Ubicación no encontrada');
      }

      // Obtener lecturas recientes
      const whereLecturas: any = {
        ubicacionId,
        empresaId,
      };

      if (opciones?.desde) {
        whereLecturas.fecha = { gte: opciones.desde };
      }
      if (opciones?.hasta) {
        whereLecturas.fecha = { ...whereLecturas.fecha, lte: opciones.hasta };
      }

      const lecturas = await this.prisma.sensorLectura.findMany({
        where: whereLecturas,
        include: {
          sensor: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
        take: opciones?.limite || 50,
      });

      // Obtener alertas recientes
      const alertas = await this.prisma.alertHistory.findMany({
        where: {
          empresaId,
          estado: 'ENVIADA',
        },
        orderBy: {
          fechaEnvio: 'desc',
        },
        take: 10,
      });

      return {
        ubicacionId: ubicacion.id,
        ubicacionNombre: ubicacion.nombre,
        lecturas: lecturas.map((lectura) => ({
          sensorId: lectura.sensorId || 0,
          sensorNombre: lectura.sensor?.nombre || 'Sensor Desconocido',
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          fecha: lectura.fecha,
          estado: this.analizarLectura(lectura.tipo, lectura.valor),
        })),
        alertas: alertas.map((alerta) => ({
          id: `alert-${alerta.id}`,
          tipo: alerta.tipo,
          severidad: alerta.severidad,
          mensaje: alerta.mensaje,
          fecha: alerta.fechaEnvio,
        })),
      };
    } catch (error) {
      this.logger.error('Error obteniendo dashboard tiempo real:', error);
      throw error;
    }
  }

  async obtenerDashboardAlertas(empresaId: number, filtros?: {
    ubicacionId?: number;
    tipo?: string;
    desde?: Date;
    hasta?: Date;
  }) {
    try {
      const whereAlertas: any = {
        empresaId,
        estado: 'ENVIADA',
      };

      if (filtros?.tipo) {
        whereAlertas.tipo = filtros.tipo;
      }
      if (filtros?.desde) {
        whereAlertas.fechaEnvio = { gte: filtros.desde };
      }
      if (filtros?.hasta) {
        whereAlertas.fechaEnvio = { ...whereAlertas.fechaEnvio, lte: filtros.hasta };
      }

      const alertas = await this.prisma.alertHistory.findMany({
        where: whereAlertas,
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: {
          fechaEnvio: 'desc',
        },
      });

      return alertas.map((alerta) => ({
        id: `alert-${alerta.id}`,
        tipo: alerta.tipo,
        severidad: alerta.severidad,
        mensaje: alerta.mensaje,
        productoId: alerta.productoId,
        productoNombre: alerta.productoNombre,
        fecha: alerta.fechaEnvio,
        estado: alerta.estado,
      }));
    } catch (error) {
      this.logger.error('Error obteniendo dashboard alertas:', error);
      throw error;
    }
  }
}
