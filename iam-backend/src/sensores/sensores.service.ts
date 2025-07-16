import { Injectable, Logger } from '@nestjs/common';
import { CreateSensorLecturaDto, TipoSensor } from './dto/create-sensor.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SensorTipo } from '@prisma/client';

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

@Injectable()
export class SensoresService {
  private readonly logger = new Logger(SensoresService.name);

  constructor(private prisma: PrismaService) {}

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

      // Convertir TipoSensor a SensorTipo
      const sensorTipo = this.convertTipoSensor(dto.tipo);

    const data: any = {
        tipo: sensorTipo,
      valor: dto.valor,
      unidad: dto.unidad,
    };

    if (dto.productoId) {
      data.productoId = dto.productoId;
    }

    const lectura = await this.prisma.sensorLectura.create({ data });

      // Analizar la lectura y determinar estado
      const estado = this.analizarLectura(sensorTipo, dto.valor);
      const mensaje = this.generarMensaje(sensorTipo, dto.valor, estado);

      // Si hay alerta, registrarla
      if (estado !== 'NORMAL') {
        await this.registrarAlerta(dto, estado, empresaId);
      }

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

  private crearAlerta(lectura: any, estado: string): SensorAlert {
    const severidad = estado === 'CRITICO' ? 'CRITICA' : 'ALTA';
    const limite = this.obtenerLimite(lectura.tipo);

    return {
      id: `alert-${lectura.id}`,
      tipo: lectura.tipo,
      severidad,
      mensaje: this.generarMensaje(lectura.tipo, lectura.valor, estado),
      productoId: lectura.productoId || undefined,
      productoNombre: lectura.producto?.nombre,
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
}
