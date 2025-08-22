import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SensorTipo, SeveridadAlerta, SensorLectura } from '@prisma/client';
import { UmbralesSensorLegacyDto } from '../dto/umbrales-sensor.dto';

// 🔧 BUENAS PRÁCTICAS: Interfaces bien definidas y tipadas
export interface EvaluacionAlerta {
  sensorId: number;
  tipo: SensorTipo;
  valor: number;
  unidad: string;
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO';
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  mensaje: string;
  umbralCriticoesExcedidos: string[];
  recomendaciones: string[];
  timestamp: Date;
  productoId?: number;
  ubicacionId?: number;
  empresaId: number;
}

export interface HistorialEvaluaciones {
  sensorId: number;
  evaluaciones: EvaluacionAlerta[];
  tendencia: 'ESTABLE' | 'MEJORANDO' | 'EMPEORANDO';
  alertasActivas: number;
  ultimaEvaluacion: Date;
}

export interface MetricasSensor {
  sensorId: number;
  tipo: SensorTipo;
  totalLecturas: number;
  lecturasUltimas24h: number;
  alertasGeneradas: number;
  alertasResueltas: number;
  tiempoPromedioResolucion: number; // en minutos
  tendenciaValores: 'ESTABLE' | 'CRECIENTE' | 'DECRECIENTE';
  valoresPromedio: {
    ultimaHora: number;
    ultimas24h: number;
    ultimaSemana: number;
  };
}

// 🔧 BUENAS PRÁCTICAS: Interfaces para validación de umbrales
export interface ValidacionUmbralesDto {
  tipo: SensorTipo;
  valor: number;
  unidad: string;
  umbralCriticoes: UmbralesSensorLegacyDto;
}

export interface ResultadoValidacionUmbralesDto {
  cumpleUmbrales: boolean;
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO';
  mensaje: string;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  umbralCriticoesExcedidos: string[];
  recomendaciones: string[];
  proximaVerificacion: Date;
}

export interface ConfiguracionUmbralesSensorDto {
  sensorId: number;
  tipo: SensorTipo;
  umbralCriticoes: UmbralesSensorLegacyDto;
  nombre?: string;
  descripcion?: string;
}

// 🔧 BUENAS PRÁCTICAS: Resultado de evaluación tipado
export interface ResultadoEvaluacion {
  estado: 'NORMAL' | 'ALERTA' | 'CRITICO';
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  umbralCriticoesExcedidos: string[];
  recomendaciones: string[];
}

@Injectable()
export class SensorAlertEvaluatorService {
  private readonly logger = new Logger(SensorAlertEvaluatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🔍 Evalúa una lectura de sensor contra los umbrales configurados
   * ✅ BUENA PRÁCTICA: Método bien documentado y tipado
   */
  async evaluarLectura(
    lectura: SensorLectura, 
    umbralCriticoes: UmbralesSensorLegacyDto
  ): Promise<ResultadoValidacionUmbralesDto> {
    try {
      const validacion: ValidacionUmbralesDto = {
        tipo: lectura.tipo,
        valor: lectura.valor,
        unidad: lectura.unidad,
        umbralCriticoes
      };

      return await this.evaluarUmbrales(validacion);
    } catch (error) {
      this.logger.error(`Error evaluando lectura del sensor ${lectura.sensorId}:`, error);
      throw new Error(`Error en evaluación de umbrales: ${error.message}`);
    }
  }

  /**
   * 🔍 Evalúa umbrales para un tipo de sensor específico
   * ✅ BUENA PRÁCTICA: Método principal bien estructurado
   */
  async evaluarUmbrales(validacion: ValidacionUmbralesDto): Promise<ResultadoValidacionUmbralesDto> {
    const { tipo, valor, umbralCriticoes } = validacion;
    
    let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
    let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'BAJA';
    let umbralCriticoesExcedidos: string[] = [];
    let recomendaciones: string[] = [];

    // ✅ BUENA PRÁCTICA: Evaluación por tipo de sensor usando switch
    switch (tipo) {
      case 'TEMPERATURA':
        const resultadoTemp = this.evaluarTemperatura(valor, umbralCriticoes);
        estado = resultadoTemp.estado;
        severidad = resultadoTemp.severidad;
        umbralCriticoesExcedidos = resultadoTemp.umbralCriticoesExcedidos;
        recomendaciones = resultadoTemp.recomendaciones;
        break;

      case 'HUMEDAD':
        const resultadoHum = this.evaluarHumedad(valor, umbralCriticoes);
        estado = resultadoHum.estado;
        severidad = resultadoHum.severidad;
        umbralCriticoesExcedidos = resultadoHum.umbralCriticoesExcedidos;
        recomendaciones = resultadoHum.recomendaciones;
        break;

      case 'PESO':
        const resultadoPeso = this.evaluarPeso(valor, umbralCriticoes);
        estado = resultadoPeso.estado;
        severidad = resultadoPeso.severidad;
        umbralCriticoesExcedidos = resultadoPeso.umbralCriticoesExcedidos;
        recomendaciones = resultadoPeso.recomendaciones;
        break;

      case 'PRESION':
        const resultadoPresion = this.evaluarPresion(valor, umbralCriticoes);
        estado = resultadoPresion.estado;
        severidad = resultadoPresion.severidad;
        umbralCriticoesExcedidos = resultadoPresion.umbralCriticoesExcedidos;
        recomendaciones = resultadoPresion.recomendaciones;
        break;

      default:
        this.logger.warn(`Tipo de sensor no soportado: ${tipo}`);
        break;
    }

    // ✅ BUENA PRÁCTICA: Cálculo de próxima verificación
    const proximaVerificacion = this.calcularProximaVerificacion(umbralCriticoes.intervaloVerificacionMinutos);

    return {
      cumpleUmbrales: estado === 'NORMAL',
      estado,
      mensaje: this.generarMensajeEvaluacion(estado, tipo, valor, umbralCriticoes),
      severidad,
      umbralCriticoesExcedidos,
      recomendaciones,
      proximaVerificacion
    };
  }

  /**
   * Evalúa umbralCriticoes de temperatura
   */
  private evaluarTemperatura(valor: number, umbralCriticoes: UmbralesSensorLegacyDto) {
    const { temperaturaMin, temperaturaMax } = umbralCriticoes;
    let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
    let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'BAJA';
    let umbralCriticoesExcedidos: string[] = [];
    let recomendaciones: string[] = [];

    if (temperaturaMin !== undefined && valor < temperaturaMin) {
      if (valor < temperaturaMin - 10) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'ALTA';
      }
      umbralCriticoesExcedidos.push(`Temperatura mínima (${temperaturaMin}°C)`);
      recomendaciones.push('Verificar sistema de calefacción o aislamiento');
    }

    if (temperaturaMax !== undefined && valor > temperaturaMax) {
      if (valor > temperaturaMax + 10) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'ALTA';
      }
      umbralCriticoesExcedidos.push(`Temperatura máxima (${temperaturaMax}°C)`);
      recomendaciones.push('Verificar sistema de refrigeración o ventilación');
    }

    return { estado, severidad, umbralCriticoesExcedidos, recomendaciones };
  }

  /**
   * Evalúa umbralCriticoes de humedad
   */
  private evaluarHumedad(valor: number, umbralCriticoes: UmbralesSensorLegacyDto) {
    const { humedadMin, humedadMax } = umbralCriticoes;
    let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
    let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'BAJA';
    let umbralCriticoesExcedidos: string[] = [];
    let recomendaciones: string[] = [];

    if (humedadMin !== undefined && valor < humedadMin) {
      if (valor < humedadMin - 20) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'MEDIA';
      }
      umbralCriticoesExcedidos.push(`Humedad mínima (${humedadMin}%)`);
      recomendaciones.push('Verificar sistema de humidificación');
    }

    if (humedadMax !== undefined && valor > humedadMax) {
      if (valor > humedadMax + 20) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'ALTA';
      }
      umbralCriticoesExcedidos.push(`Humedad máxima (${humedadMax}%)`);
      recomendaciones.push('Verificar sistema de deshumidificación o ventilación');
    }

    return { estado, severidad, umbralCriticoesExcedidos, recomendaciones };
  }

  /**
   * Evalúa umbralCriticoes de peso
   */
  private evaluarPeso(valor: number, umbralCriticoes: UmbralesSensorLegacyDto) {
    const { pesoMin, pesoMax } = umbralCriticoes;
    let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
    let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'BAJA';
    let umbralCriticoesExcedidos: string[] = [];
    let recomendaciones: string[] = [];

    if (pesoMin !== undefined && valor < pesoMin) {
      if (valor < pesoMin * 0.5) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'MEDIA';
      }
      umbralCriticoesExcedidos.push(`Peso mínimo (${pesoMin}kg)`);
      recomendaciones.push('Verificar inventario y reposición de stock');
    }

    if (pesoMax !== undefined && valor > pesoMax) {
      if (valor > pesoMax * 1.5) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'ALTA';
      }
      umbralCriticoesExcedidos.push(`Peso máximo (${pesoMax}kg)`);
      recomendaciones.push('Verificar capacidad de almacenamiento');
    }

    return { estado, severidad, umbralCriticoesExcedidos, recomendaciones };
  }

  /**
   * Evalúa umbralCriticoes de presión
   */
  private evaluarPresion(valor: number, umbralCriticoes: UmbralesSensorLegacyDto) {
    const { presionMin, presionMax } = umbralCriticoes;
    let estado: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
    let severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA' = 'BAJA';
    let umbralCriticoesExcedidos: string[] = [];
    let recomendaciones: string[] = [];

    if (presionMin !== undefined && valor < presionMin) {
      if (valor < presionMin * 0.7) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'ALTA';
      }
      umbralCriticoesExcedidos.push(`Presión mínima (${presionMin}Pa)`);
      recomendaciones.push('Verificar sistema de presión y posibles fugas');
    }

    if (presionMax !== undefined && valor > presionMax) {
      if (valor > presionMax * 1.3) {
        estado = 'CRITICO';
        severidad = 'CRITICA';
      } else {
        estado = 'ALERTA';
        severidad = 'ALTA';
      }
      umbralCriticoesExcedidos.push(`Presión máxima (${presionMax}Pa)`);
      recomendaciones.push('Verificar válvulas de seguridad y sistema de control');
    }

    return { estado, severidad, umbralCriticoesExcedidos, recomendaciones };
  }

  /**
   * 🔍 Genera mensaje de evaluación basado en el estado y tipo de sensor
   * ✅ BUENA PRÁCTICA: Función bien tipada y documentada
   */
  private generarMensajeEvaluacion(
    estado: string, 
    tipo: SensorTipo, 
    valor: number, 
    umbralCriticoes: UmbralesSensorLegacyDto
  ): string {
    if (estado === 'NORMAL') {
      return `${tipo} en rango normal: ${valor}`;
    }

    // ✅ BUENA PRÁCTICA: Generar mensaje basado en el tipo de sensor
    switch (tipo) {
      case 'TEMPERATURA':
        if (estado === 'ALERTA') {
          return `Temperatura ${estado.toLowerCase()}: ${valor}°C - Verificar sistema de climatización`;
        }
        return `Temperatura ${estado.toLowerCase()}: ${valor}°C - Requiere atención inmediata`;
      
      case 'HUMEDAD':
        if (estado === 'ALERTA') {
          return `Humedad ${estado.toLowerCase()}: ${valor}% - Verificar ventilación`;
        }
        return `Humedad ${estado.toLowerCase()}: ${valor}% - Requiere atención inmediata`;
      
      case 'PESO':
        if (estado === 'ALERTA') {
          return `Peso ${estado.toLowerCase()}: ${valor}kg - Verificar carga`;
        }
        return `Peso ${estado.toLowerCase()}: ${valor}kg - Requiere atención inmediata`;
      
      case 'PRESION':
        if (estado === 'ALERTA') {
          return `Presión ${estado.toLowerCase()}: ${valor}Pa - Verificar sistema`;
        }
        return `Presión ${estado.toLowerCase()}: ${valor}Pa - Requiere atención inmediata`;
      
      default:
        return `${tipo} ${estado.toLowerCase()}: ${valor}`;
    }
  }

  /**
   * 🔍 Calcula la próxima verificación basada en el intervalo configurado
   * ✅ BUENA PRÁCTICA: Función utilitaria bien tipada
   */
  private calcularProximaVerificacion(intervaloMinutos?: number): Date {
    const intervaloMs = (intervaloMinutos || 5) * 60 * 1000;
    return new Date(Date.now() + intervaloMs);
  }

  /**
   * Obtiene el historial de evaluaciones de un sensor
   */
  async obtenerHistorialEvaluaciones(
    sensorId: number, 
    empresaId: number, 
    limite: number = 100
  ): Promise<HistorialEvaluaciones> {
    try {
      const sensor = await this.prisma.sensor.findFirst({
        where: { id: sensorId, empresaId },
        include: { ubicacion: true }
      });

      if (!sensor) {
        throw new Error('Sensor no encontrado');
      }

      const lecturas = await this.prisma.sensorLectura.findMany({
        where: { sensorId, empresaId },
        orderBy: { fecha: 'desc' },
        take: limite,
        include: { producto: true }
      });

      const evaluaciones: EvaluacionAlerta[] = [];
      let alertasActivas = 0;

      for (const lectura of lecturas) {
        // Aquí deberías obtener los umbralCriticoes configurados para este sensor
        const umbralCriticoes = await this.obtenerUmbralesSensor(sensorId, empresaId);
        const evaluacion = await this.evaluarLectura(lectura, umbralCriticoes);
        
        if (evaluacion.estado !== 'NORMAL') {
          alertasActivas++;
        }

        evaluaciones.push({
          sensorId,
          tipo: lectura.tipo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          estado: evaluacion.estado,
          severidad: evaluacion.severidad,
          mensaje: evaluacion.mensaje,
          umbralCriticoesExcedidos: evaluacion.umbralCriticoesExcedidos,
          recomendaciones: evaluacion.recomendaciones,
          timestamp: lectura.fecha,
          productoId: lectura.productoId || undefined,
          ubicacionId: lectura.ubicacionId || undefined,
          empresaId: lectura.empresaId
        });
      }

      const tendencia = this.calcularTendencia(evaluaciones);
      const ultimaEvaluacion = evaluaciones.length > 0 ? evaluaciones[0].timestamp : new Date();

      return {
        sensorId,
        evaluaciones,
        tendencia,
        alertasActivas,
        ultimaEvaluacion
      };
    } catch (error) {
      this.logger.error(`Error obteniendo historial de evaluaciones:`, error);
      throw new Error(`Error obteniendo historial: ${error.message}`);
    }
  }

  /**
   * Obtiene métricas de un sensor
   */
  async obtenerMetricasSensor(
    sensorId: number, 
    empresaId: number
  ): Promise<MetricasSensor> {
    try {
      const sensor = await this.prisma.sensor.findFirst({
        where: { id: sensorId, empresaId }
      });

      if (!sensor) {
        throw new Error('Sensor no encontrado');
      }

      const ahora = new Date();
      const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
      const hace1h = new Date(ahora.getTime() - 60 * 60 * 1000);
      const hace1semana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalLecturas,
        lecturas24h,
        lecturas1h,
        lecturas1semana,
        alertasGeneradas,
        alertasResueltas
      ] = await Promise.all([
        this.prisma.sensorLectura.count({ where: { sensorId, empresaId } }),
        this.prisma.sensorLectura.count({ where: { sensorId, empresaId, fecha: { gte: hace24h } } }),
        this.prisma.sensorLectura.count({ where: { sensorId, empresaId, fecha: { gte: hace1h } } }),
        this.prisma.sensorLectura.count({ where: { sensorId, empresaId, fecha: { gte: hace1semana } } }),
        this.prisma.alertaHistorial.count({ where: { sensorId, empresaId, tipo: 'SENSOR' } }),
        this.prisma.alertaHistorial.count({ where: { sensorId, empresaId, tipo: 'SENSOR', estado: 'RESUELTA' } })
      ]);

      // Calcular valores promedio
      const valores24h = await this.prisma.sensorLectura.findMany({
        where: { sensorId, empresaId, fecha: { gte: hace24h } },
        select: { valor: true }
      });

      const valores1h = await this.prisma.sensorLectura.findMany({
        where: { sensorId, empresaId, fecha: { gte: hace1h } },
        select: { valor: true }
      });

      const valores1semana = await this.prisma.sensorLectura.findMany({
        where: { sensorId, empresaId, fecha: { gte: hace1semana } },
        select: { valor: true }
      });

      const valoresPromedio = {
        ultimaHora: valores1h.length > 0 ? valores1h.reduce((sum, v) => sum + v.valor, 0) / valores1h.length : 0,
        ultimas24h: valores24h.length > 0 ? valores24h.reduce((sum, v) => sum + v.valor, 0) / valores24h.length : 0,
        ultimaSemana: valores1semana.length > 0 ? valores1semana.reduce((sum, v) => sum + v.valor, 0) / valores1semana.length : 0
      };

      const tendencia = this.calcularTendenciaValores(valores24h.map(v => v.valor));

      return {
        sensorId,
        tipo: sensor.tipo,
        totalLecturas,
        lecturasUltimas24h: lecturas24h,
        alertasGeneradas,
        alertasResueltas,
        tiempoPromedioResolucion: 0, // TODO: Implementar cálculo real
        tendenciaValores: tendencia,
        valoresPromedio
      };
    } catch (error) {
      this.logger.error(`Error obteniendo métricas del sensor:`, error);
      throw new Error(`Error obteniendo métricas: ${error.message}`);
    }
  }

  /**
   * Obtiene umbralCriticoes configurados para un sensor
   */
  private async obtenerUmbralesSensor(sensorId: number, empresaId: number): Promise<UmbralesSensorLegacyDto> {
    try {
      const sensor = await this.prisma.sensor.findFirst({
        where: { id: sensorId, empresaId }
      });

      if (!sensor || !sensor.configuracion) {
        // Retornar umbralCriticoes por defecto según el tipo
        return this.obtenerUmbralesPorDefecto(sensor?.tipo || 'TEMPERATURA');
      }

      const config = sensor.configuracion as any;
      return {
        temperaturaMin: config.temperaturaMin,
        temperaturaMax: config.temperaturaMax,
        humedadMin: config.humedadMin,
        humedadMax: config.humedadMax,
        pesoMin: config.pesoMin,
        pesoMax: config.pesoMax,
        presionMin: config.presionMin,
        presionMax: config.presionMax,
        alertasActivas: config.alertasActivas ?? true,
        mensajeAlerta: config.mensajeAlerta,
        mensajeCritico: config.mensajeCritico,
        destinatarios: config.destinatarios,
        severidad: config.severidad ?? 'MEDIA',
        intervaloVerificacionMinutos: config.intervaloVerificacionMinutos ?? 5,
        configuracionNotificacionEmail: config.configuracionNotificacionEmail ?? true,
        configuracionNotificacionSMS: config.configuracionNotificacionSMS ?? false,
        configuracionNotificacionWebSocket: config.configuracionNotificacionWebSocket ?? true
      };
    } catch (error) {
      this.logger.error(`Error obteniendo umbralCriticoes del sensor:`, error);
      return this.obtenerUmbralesPorDefecto('TEMPERATURA');
    }
  }

  /**
   * Obtiene umbralCriticoes por defecto según el tipo de sensor
   */
  private obtenerUmbralesPorDefecto(tipo: SensorTipo): UmbralesSensorLegacyDto {
    switch (tipo) {
      case 'TEMPERATURA':
        return {
          temperaturaMin: 15,
          temperaturaMax: 25,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
      case 'HUMEDAD':
        return {
          humedadMin: 40,
          humedadMax: 60,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
      case 'PESO':
        return {
          pesoMin: 100,
          pesoMax: 900,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 10
        };
      case 'PRESION':
        return {
          presionMin: 1000,
          presionMax: 1500,
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
      default:
        return {
          alertasActivas: true,
          severidad: 'MEDIA',
          intervaloVerificacionMinutos: 5
        };
    }
  }

  /**
   * Calcula tendencia basada en evaluaciones
   */
  private calcularTendencia(evaluaciones: EvaluacionAlerta[]): 'ESTABLE' | 'MEJORANDO' | 'EMPEORANDO' {
    if (evaluaciones.length < 3) return 'ESTABLE';

    const ultimas3 = evaluaciones.slice(0, 3);
    const estados = ultimas3.map(e => e.estado);
    
    if (estados.every(e => e === 'NORMAL')) return 'MEJORANDO';
    if (estados.every(e => e !== 'NORMAL')) return 'EMPEORANDO';
    
    return 'ESTABLE';
  }

  /**
   * Calcula tendencia basada en valores numéricos
   */
  private calcularTendenciaValores(valores: number[]): 'ESTABLE' | 'CRECIENTE' | 'DECRECIENTE' {
    if (valores.length < 3) return 'ESTABLE';

    const ultimos3 = valores.slice(0, 3);
    const promedio = ultimos3.reduce((sum, val) => sum + val, 0) / ultimos3.length;
    const variacion = Math.abs(ultimos3[0] - promedio) / promedio;

    if (variacion < 0.05) return 'ESTABLE';
    if (ultimos3[0] > promedio) return 'CRECIENTE';
    return 'DECRECIENTE';
  }

  /**
   * Valida configuración de umbralCriticoes
   */
  async validarConfiguracionUmbrales(
    configuracion: ConfiguracionUmbralesSensorDto
  ): Promise<{ valido: boolean; errores: string[] }> {
    const errores: string[] = [];
    const { tipo, umbralCriticoes } = configuracion;

    // Validar umbralCriticoes según el tipo
    switch (tipo) {
      case 'TEMPERATURA':
        if (umbralCriticoes.temperaturaMin !== undefined && umbralCriticoes.temperaturaMax !== undefined) {
          if (umbralCriticoes.temperaturaMin >= umbralCriticoes.temperaturaMax) {
            errores.push('La temperatura mínima debe ser menor que la máxima');
          }
        }
        break;

      case 'HUMEDAD':
        if (umbralCriticoes.humedadMin !== undefined && umbralCriticoes.humedadMax !== undefined) {
          if (umbralCriticoes.humedadMin >= umbralCriticoes.humedadMax) {
            errores.push('La humedad mínima debe ser menor que la máxima');
          }
        }
        break;

      case 'PESO':
        if (umbralCriticoes.pesoMin !== undefined && umbralCriticoes.pesoMax !== undefined) {
          if (umbralCriticoes.pesoMin >= umbralCriticoes.pesoMax) {
            errores.push('El peso mínimo debe ser menor que el máximo');
          }
        }
        break;

      case 'PRESION':
        if (umbralCriticoes.presionMin !== undefined && umbralCriticoes.presionMax !== undefined) {
          if (umbralCriticoes.presionMin >= umbralCriticoes.presionMax) {
            errores.push('La presión mínima debe ser menor que la máxima');
          }
        }
        break;
    }

    // Validar intervalo de verificación
    if (umbralCriticoes.intervaloVerificacionMinutos !== undefined) {
      if (umbralCriticoes.intervaloVerificacionMinutos < 1 || umbralCriticoes.intervaloVerificacionMinutos > 1440) {
        errores.push('El intervalo de verificación debe estar entre 1 y 1440 minutos');
      }
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}
