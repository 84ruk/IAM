import { SeveridadAlerta } from '@prisma/client';
import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';

export class DashboardUbicacionesDto {
  @IsOptional()
  @IsNumber()
  empresaId?: number;
}

export class DashboardUbicacionTiempoRealDto {
  @IsNumber()
  ubicacionId: number;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsNumber()
  limite?: number = 50;
}

export class DashboardAlertasDto {
  @IsOptional()
  @IsNumber()
  ubicacionId?: number;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}

export interface DashboardUbicacionStats {
  ubicacion: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  estadisticas: {
    totalSensores: number;
    sensoresActivos: number;
    lecturasUltimas24h: number;
    alertasActivas: number;
    sensoresPorTipo: {
      tipo: string;
      cantidad: number;
    }[];
  };
  sensores: {
    id: number;
    nombre: string;
    tipo: string;
    activo: boolean;
    ultimaLectura?: {
      valor: number;
      unidad: string;
      fecha: Date;
      estado: string;
    };
  }[];
}

export interface DashboardTiempoReal {
  ubicacionId: number;
  ubicacionNombre: string;
  lecturas: {
    sensorId: number;
    sensorNombre: string;
    tipo: string;
    valor: number;
    unidad: string;
    fecha: Date;
    estado: string;
  }[];
  alertas: {
    id: string;
    tipo: string;
    severidad: SeveridadAlerta;
    mensaje: string;
    fecha: Date;
  }[];
} 