export interface SensorLectura {
  id?: number;
  tipo: 'TEMPERATURA' | 'HUMEDAD' | 'PRESION' | 'PESO';
  valor: number;
  unidad: string;
  sensorId?: number;
  productoId?: number;
  ubicacionId?: number;
  empresaId: number;
  fecha?: Date;
  sensor?: {
    id: number;
    nombre: string;
    tipo: string;
  };
  ubicacion?: {
    id: number;
    nombre: string;
  };
  producto?: {
    id: number;
    nombre: string;
  };
}

export interface AlertaConfiguracion {
  id: number;
  nombre: string;
  tipo: string;
  empresaId: number;
  ubicacionId?: number;
  sensorId?: number;
  umbrales: UmbralAlertaDto;
  umbralCritico?: UmbralAlertaDto;
  destinatarios: string[];
  destinatariosSMS: string[];
  mensaje: string;
  mensajeSMS?: string;
  enviarEmail: boolean;
  enviarSMS: boolean;
  prioridadSMS?: 'low' | 'normal' | 'high' | 'urgent';
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UmbralAlertaDto {
  temperaturaMin?: number;
  temperaturaMax?: number;
  humedadMin?: number;
  humedadMax?: number;
  pesoMin?: number;
  pesoMax?: number;
  presionMin?: number;
  presionMax?: number;
}

export interface AlertaGenerada {
  id: number;
  tipo: string;
  mensaje: string;
  severidad: string;
  empresaId: number;
  ubicacionId?: number;
  sensorId?: number;
  productoId?: number;
  fecha: Date;
  estado: string;
  condicionActivacion: Record<string, unknown>;
}

export interface SensoresGateway {
  emitirEstadoSensores: (data: Record<string, unknown>, empresaId: number) => Promise<void>;
} 