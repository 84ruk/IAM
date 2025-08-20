export enum TipoDestinatarioAlerta {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  AMBOS = 'AMBOS'
}

export enum SeveridadAlerta {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA'
}

export interface NotificacionConfig {
  email: boolean;
  sms: boolean;
  webSocket: boolean;
  push?: boolean;
  mensajeSMS?: string;
  mensajeEmail?: string;
  mensajeWebSocket?: string;
  mensajePush?: string;
}

export interface UmbralCritico {
  enviarSMS: boolean;
  mensajeSMS?: string;
  mensajePersonalizado?: string;
  prioridadSMS: 'normal' | 'high';
  destinatarios: string[];
  temperaturaMin?: number;
  temperaturaMax?: number;
  humedadMin?: number;
  humedadMax?: number;
  presionMin?: number;
  presionMax?: number;
  pesoMin?: number;
  pesoMax?: number;
  variacionPorcentual?: number;
}

export interface Destinatario {
  id?: number;
  nombre: string;
  email: string;
  telefono?: string;
  tipo: TipoDestinatarioAlerta;
  configuracionAlertaId: number;
}

export interface ConfiguracionAlerta {
  id: number;
  sensorId: number;
  empresaId: number;
  tipoAlerta: string;
  activo: boolean;
  frecuencia: string;
  ventanaEsperaMinutos: number | null;
  umbralCritico: UmbralCritico;
  configuracionNotificacion: NotificacionConfig;
  destinatarios: Destinatario[];
  createdAt: Date;
  updatedAt: Date;
}
