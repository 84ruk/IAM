import { Prisma, SeveridadAlerta, TipoDestinatarioAlerta as PrismaTipoDestinatarioAlerta } from '@prisma/client';

export type TipoDestinatarioAlerta = PrismaTipoDestinatarioAlerta;

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

export interface UmbralCriticoConfig {
  enviarSMS?: boolean;
  mensajeSMS?: string;
  mensajePersonalizado?: string;
  prioridadSMS?: 'normal' | 'high';
  destinatarios: string[];
  temperaturaMin?: number;
  temperaturaMax?: number;
  humedadMin?: number;
  humedadMax?: number;
  presionMin?: number;
  presionMax?: number;
  pesoMin?: number;
  pesoMax?: number;
}

export interface DestinatarioAlertaModel {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  tipo: TipoDestinatarioAlerta;
  activo: boolean;
  empresaId: number;
  configuracionAlertaId?: number;
}

export interface AlternarDestinatario {
  id?: number;
  configuracionAlertaId: number;
  destinatarioId: number;
}

export interface DestinatarioAlertaModel {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  tipo: TipoDestinatarioAlerta;
  activo: boolean;
  empresaId: number;
  configuracionAlertaId?: number;
}

export interface AlertaConfiguracion {
  id: number;
  sensorId: number;
  empresaId: number;
  tipoAlerta: string;
  activo: boolean;
  frecuencia: string;
  ventanaEsperaMinutos: number | null;
  umbralCritico: UmbralCriticoConfig;
  configuracionNotificacion: NotificacionConfig;
  destinatarios: DestinatarioAlertaModel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertaGenerada {
  id: number;
  tipo: string;
  mensaje: string;
  severidad: SeveridadAlerta;
  empresaId: number;
  sensorId?: number;
  productoId?: number;
  fecha: Date;
  estado: string;
  condicionActivacion: Record<string, any>;
  titulo: string;
  valor?: string;
  detalles: {
    lectura: Record<string, any>;
    umbralCritico: UmbralCriticoConfig;
  };
}
