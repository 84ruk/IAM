import { Sensor } from '@prisma/client';

export interface SensorWithLocation extends Sensor {
  ubicacion: {
    id: number;
    nombre: string;
  };
} 