import { TipoIndustria } from "@prisma/client"
import { CreateProductoDto } from "src/producto/dto/create-producto.dto"


  

type CampoProducto = keyof CreateProductoDto

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
    camposRelevantes: ['talla', 'color', 'etiquetas'],
  },
  ELECTRONICA: {
    label: 'Electrónica',
    camposRelevantes: ['sku', 'codigoBarras', 'rfid'],
  },
  GENERICA: {
    label: 'Genérica',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion', 'talla', 'color', 'etiquetas', 'sku', 'codigoBarras', 'rfid' ],
  },
  FARMACIA: {
    label: 'Farmacia',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion', 'etiquetas', 'codigoBarras', 'rfid'],
    sensoresActivos: true,
    mostrarTemperaturaHumedad: true,
  }
}
