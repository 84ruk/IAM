// src/config/industrias.config.ts

export type TipoIndustria = 'ALIMENTOS' | 'ROPA' | 'ELECTRONICA' | 'GENERICA' | 'FARMACIA'

type CampoProducto = 
  | 'temperaturaOptima'
  | 'humedadOptima'
  | 'ubicacion'
  | 'talla'
  | 'color'
  | 'etiqueta'
  | 'sku'
  | 'codigoBarras'
  | 'rfid'

export interface IndustriaConfig {
  label: string
  camposRelevantes: CampoProducto[]
  sensoresActivos?: boolean
  mostrarTemperaturaHumedad?: boolean
}

export const INDUSTRIAS: Record<TipoIndustria, IndustriaConfig> = {
  ALIMENTOS: {
    label: 'Alimentos',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion'],
    sensoresActivos: true,
    mostrarTemperaturaHumedad: true,
  },
  ROPA: {
    label: 'Ropa',
    camposRelevantes: ['talla', 'color', 'etiqueta'],
  },
  ELECTRONICA: {
    label: 'Electrónica',
    camposRelevantes: ['sku', 'codigoBarras', 'rfid'],
  },
  GENERICA: {
    label: 'GENERICA',
    camposRelevantes: [
      'temperaturaOptima', 'humedadOptima', 'ubicacion',
      'talla', 'color', 'etiqueta',
      'sku', 'codigoBarras', 'rfid'
    ],
  },
  FARMACIA: {
    label: 'Farmacia',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion', 'etiqueta', 'codigoBarras', 'rfid'],
    sensoresActivos: true,
    mostrarTemperaturaHumedad: true,
  }
}
