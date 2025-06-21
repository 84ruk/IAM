import { CreateProductoDto } from "src/producto/dto/create-producto.dto"


export type IndustriaKey = 'ALIMENTOS' | 'ROPA' | 'ELECTRÓNICA' | 'OTRO'

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
  OTRO: {
    label: 'Otro',
    camposRelevantes: ['descripcion'],
  },
}
