import { Injectable, Logger } from '@nestjs/common';

export interface SMSTemplate {
  id: string;
  nombre: string;
  tipo: string;
  contenido: string;
  variables: string[];
  activo: boolean;
  prioridad: 'low' | 'normal' | 'high' | 'urgent';
  emoji?: string;
}

export interface TemplateVariable {
  nombre: string;
  descripcion: string;
  ejemplo: string;
  requerido: boolean;
}

@Injectable()
export class SMSTemplateService {
  private readonly logger = new Logger(SMSTemplateService.name);

  // Plantillas predefinidas
  private readonly templates: SMSTemplate[] = [
    {
      id: 'temperatura_critica',
      nombre: 'Temperatura Crítica',
      tipo: 'TEMPERATURA_CRITICA',
      contenido: '🔥 {tipo}: {valor}{unidad} - {ubicacion} - {fecha}',
      variables: ['tipo', 'valor', 'unidad', 'ubicacion', 'fecha'],
      activo: true,
      prioridad: 'urgent',
      emoji: '🔥',
    },
    {
      id: 'humedad_baja',
      nombre: 'Humedad Baja',
      tipo: 'HUMEDAD_BAJA',
      contenido: '💧 {tipo}: {valor}{unidad} - {ubicacion} - {fecha}',
      variables: ['tipo', 'valor', 'unidad', 'ubicacion', 'fecha'],
      activo: true,
      prioridad: 'high',
      emoji: '💧',
    },
    {
      id: 'peso_anormal',
      nombre: 'Peso Anormal',
      tipo: 'PESO_ANORMAL',
      contenido: '⚖️ {tipo}: {valor}{unidad} - {ubicacion} - {fecha}',
      variables: ['tipo', 'valor', 'unidad', 'ubicacion', 'fecha'],
      activo: true,
      prioridad: 'high',
      emoji: '⚖️',
    },
    {
      id: 'sensor_offline',
      nombre: 'Sensor Offline',
      tipo: 'SENSOR_OFFLINE',
      contenido: '⚠️ Sensor {sensor} offline en {ubicacion} - {fecha}',
      variables: ['sensor', 'ubicacion', 'fecha'],
      activo: true,
      prioridad: 'high',
      emoji: '⚠️',
    },
    {
      id: 'mantenimiento_programado',
      nombre: 'Mantenimiento Programado',
      tipo: 'MANTENIMIENTO',
      contenido: '🔧 Mantenimiento programado en {ubicacion} - {fecha}',
      variables: ['ubicacion', 'fecha'],
      activo: true,
      prioridad: 'normal',
      emoji: '🔧',
    },
    {
      id: 'stock_bajo',
      nombre: 'Stock Bajo',
      tipo: 'STOCK_BAJO',
      contenido: '📦 Stock bajo: {producto} - {stock} unidades - {ubicacion}',
      variables: ['producto', 'stock', 'ubicacion'],
      activo: true,
      prioridad: 'high',
      emoji: '📦',
    },
    {
      id: 'alerta_general',
      nombre: 'Alerta General',
      tipo: 'ALERTA_GENERAL',
      contenido: '🚨 {tipo}: {mensaje} - {ubicacion} - {fecha}',
      variables: ['tipo', 'mensaje', 'ubicacion', 'fecha'],
      activo: true,
      prioridad: 'normal',
      emoji: '🚨',
    },
  ];

  // Variables disponibles
  private readonly variables: TemplateVariable[] = [
    {
      nombre: 'tipo',
      descripcion: 'Tipo de sensor o alerta',
      ejemplo: 'TEMPERATURA, HUMEDAD, PESO',
      requerido: true,
    },
    {
      nombre: 'valor',
      descripcion: 'Valor de la lectura',
      ejemplo: '25.5, 60, 150.0',
      requerido: true,
    },
    {
      nombre: 'unidad',
      descripcion: 'Unidad de medida',
      ejemplo: '°C, %, kg',
      requerido: true,
    },
    {
      nombre: 'ubicacion',
      descripcion: 'Nombre de la ubicación',
      ejemplo: 'Almacén Principal',
      requerido: false,
    },
    {
      nombre: 'fecha',
      descripcion: 'Fecha y hora de la alerta',
      ejemplo: '15/01/2024 14:30',
      requerido: true,
    },
    {
      nombre: 'sensor',
      descripcion: 'Nombre del sensor',
      ejemplo: 'Sensor Temp 1',
      requerido: false,
    },
    {
      nombre: 'producto',
      descripcion: 'Nombre del producto',
      ejemplo: 'Producto A',
      requerido: false,
    },
    {
      nombre: 'stock',
      descripcion: 'Cantidad de stock',
      ejemplo: '5',
      requerido: false,
    },
    {
      nombre: 'mensaje',
      descripcion: 'Mensaje personalizado',
      ejemplo: 'Valor fuera del rango',
      requerido: false,
    },
  ];

  obtenerPlantillas(): SMSTemplate[] {
    return this.templates.filter(template => template.activo);
  }

  obtenerPlantillaPorTipo(tipo: string): SMSTemplate | null {
    return this.templates.find(template => template.tipo === tipo && template.activo) || null;
  }

  obtenerPlantillaPorId(id: string): SMSTemplate | null {
    return this.templates.find(template => template.id === id && template.activo) || null;
  }

  obtenerVariables(): TemplateVariable[] {
    return this.variables;
  }

  procesarPlantilla(templateId: string, datos: Record<string, any>): string {
    try {
      const plantilla = this.obtenerPlantillaPorId(templateId);
      if (!plantilla) {
        throw new Error(`Plantilla no encontrada: ${templateId}`);
      }

      let contenido = plantilla.contenido;

      // Reemplazar variables en la plantilla
      for (const variable of plantilla.variables) {
        const valor = datos[variable];
        if (valor !== undefined) {
          contenido = contenido.replace(new RegExp(`{${variable}}`, 'g'), valor.toString());
        } else {
          // Si la variable es requerida y no está presente, usar valor por defecto
          if (this.esVariableRequerida(variable)) {
            contenido = contenido.replace(new RegExp(`{${variable}}`, 'g'), 'N/A');
          }
        }
      }

      // Limitar a 160 caracteres (límite típico de SMS)
      if (contenido.length > 160) {
        contenido = contenido.substring(0, 157) + '...';
      }

      this.logger.log(`Plantilla procesada: ${templateId} -> ${contenido}`);
      return contenido;
    } catch (error) {
      this.logger.error(`Error procesando plantilla ${templateId}: ${error.message}`);
      return `Alerta: ${datos.tipo || 'Desconocido'} = ${datos.valor || 'N/A'}${datos.unidad || ''}`;
    }
  }

  procesarPlantillaPorTipo(tipo: string, datos: Record<string, any>): string {
    const plantilla = this.obtenerPlantillaPorTipo(tipo);
    if (plantilla) {
      return this.procesarPlantilla(plantilla.id, datos);
    }

    // Plantilla por defecto si no se encuentra
    return this.procesarPlantilla('alerta_general', datos);
  }

  crearPlantillaPersonalizada(
    nombre: string,
    tipo: string,
    contenido: string,
    variables: string[],
    prioridad: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    emoji?: string,
  ): SMSTemplate {
    const nuevaPlantilla: SMSTemplate = {
      id: `custom_${Date.now()}`,
      nombre,
      tipo,
      contenido,
      variables,
      activo: true,
      prioridad,
      emoji,
    };

    this.templates.push(nuevaPlantilla);
    this.logger.log(`Plantilla personalizada creada: ${nuevaPlantilla.id}`);
    return nuevaPlantilla;
  }

  validarPlantilla(contenido: string, variables: string[]): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Verificar que las variables en el contenido existan en la lista
    const variablesEnContenido = this.extraerVariablesDelContenido(contenido);
    const variablesNoDefinidas = variablesEnContenido.filter(v => !variables.includes(v));
    
    if (variablesNoDefinidas.length > 0) {
      errores.push(`Variables no definidas: ${variablesNoDefinidas.join(', ')}`);
    }

    // Verificar longitud del contenido
    if (contenido.length > 160) {
      errores.push('El contenido excede el límite de 160 caracteres');
    }

    // Verificar que las variables requeridas estén presentes
    const variablesRequeridas = this.variables
      .filter(v => v.requerido)
      .map(v => v.nombre);
    
    const variablesRequeridasFaltantes = variablesRequeridas.filter(v => !variables.includes(v));
    
    if (variablesRequeridasFaltantes.length > 0) {
      errores.push(`Variables requeridas faltantes: ${variablesRequeridasFaltantes.join(', ')}`);
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  private extraerVariablesDelContenido(contenido: string): string[] {
    const regex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(contenido)) !== null) {
      variables.push(match[1]);
    }

    return [...new Set(variables)]; // Eliminar duplicados
  }

  private esVariableRequerida(variable: string): boolean {
    const variableInfo = this.variables.find(v => v.nombre === variable);
    return variableInfo?.requerido || false;
  }

  obtenerPlantillasPorPrioridad(prioridad: 'low' | 'normal' | 'high' | 'urgent'): SMSTemplate[] {
    return this.templates.filter(template => template.prioridad === prioridad && template.activo);
  }

  obtenerPlantillasConEmoji(): SMSTemplate[] {
    return this.templates.filter(template => template.emoji && template.activo);
  }
} 