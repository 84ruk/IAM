import { CreateProductoDto } from "src/producto/dto/create-producto.dto"


export type IndustriaKey = 'ALIMENTOS' | 'ROPA' | 'ELECTRÓNICA' | 'GENERICA'

type CampoProducto = keyof CreateProductoDto

export interface IndustriaConfig {
  label: string
  camposRelevantes: CampoProducto[]
  sensoresActivos?: boolean
  mostrarTemperaturaHumedad?: boolean
}

export const INDUSTRIAS: Record<IndustriaKey, IndustriaConfig> = {
  ALIMENTOS: {
    label: 'Alimentos',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion'],
    sensoresActivos: true,
    mostrarTemperaturaHumedad: true,
  },
  ROPA: {
    label: 'Ropa',
    camposRelevantes: ['talla', 'color', 'categoria'],
  },
  ELECTRÓNICA: {
    label: 'Electrónica',
    camposRelevantes: ['sku', 'codigoBarras', 'rfid'],
  },
  GENERICA: {
    label: 'GENERICA',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion', 'talla', 'color', 'categoria', 'sku', 'codigoBarras', 'rfid' ],
  },
}
