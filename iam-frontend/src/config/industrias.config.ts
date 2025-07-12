// src/config/industrias.config.ts

export type TipoIndustria = 'ALIMENTOS' | 'ROPA' | 'ELECTRONICA' | 'GENERICA' | 'FARMACIA'

type CampoProducto = 
  | 'temperaturaOptima'
  | 'humedadOptima'
  | 'ubicacion'
  | 'talla'
  | 'color'
  | 'etiquetas'
  | 'sku'
  | 'codigoBarras'
  | 'rfid'

export interface IndustriaConfig {
  label: string
  camposRelevantes: CampoProducto[]
  sensoresActivos?: boolean
  mostrarTemperaturaHumedad?: boolean
  validaciones?: {
    temperaturaMin?: number
    temperaturaMax?: number
    humedadMin?: number
    humedadMax?: number
  }
  opciones?: {
    tallas?: string[]
    colores?: string[]
  }
}

export const INDUSTRIAS: Record<TipoIndustria, IndustriaConfig> = {
  ALIMENTOS: {
    label: 'Restaurante',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion'],
    sensoresActivos: true,
    mostrarTemperaturaHumedad: true,
    validaciones: {
      temperaturaMin: -10,
      temperaturaMax: 50,
      humedadMin: 0,
      humedadMax: 100
    }
  },
  ROPA: {
    label: 'Ropa',
    camposRelevantes: ['talla', 'color'],
    opciones: {
      tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colores: ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Marrón']
    }
  },
  ELECTRONICA: {
    label: 'Electrónica',
    camposRelevantes: ['sku', 'codigoBarras', 'rfid'],
  },
  GENERICA: {
    label: 'Genérica',
    camposRelevantes: [
      'temperaturaOptima', 'humedadOptima', 'ubicacion',
      'talla', 'color',
      'sku', 'codigoBarras', 'rfid'
    ],
    opciones: {
      tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colores: ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Marrón']
    }
  },
  FARMACIA: {
    label: 'Farmacia',
    camposRelevantes: ['temperaturaOptima', 'humedadOptima', 'ubicacion', 'codigoBarras', 'rfid'],
    sensoresActivos: true,
    mostrarTemperaturaHumedad: true,
    validaciones: {
      temperaturaMin: 2,
      temperaturaMax: 25,
      humedadMin: 30,
      humedadMax: 70
    }
  }
}

// Función helper para obtener configuración de industria
export function getIndustriaConfig(tipo: TipoIndustria): IndustriaConfig {
  return INDUSTRIAS[tipo] || INDUSTRIAS.GENERICA
}

// Función helper para validar campos por industria
export function validarCampoPorIndustria(
  campo: CampoProducto, 
  valor: any, 
  tipoIndustria: TipoIndustria
): string | null {
  const config = getIndustriaConfig(tipoIndustria)
  
  if (!config.validaciones) return null
  
  switch (campo) {
    case 'temperaturaOptima':
      if (config.validaciones.temperaturaMin !== undefined && valor < config.validaciones.temperaturaMin) {
        return `La temperatura mínima para ${config.label} es ${config.validaciones.temperaturaMin}°C`
      }
      if (config.validaciones.temperaturaMax !== undefined && valor > config.validaciones.temperaturaMax) {
        return `La temperatura máxima para ${config.label} es ${config.validaciones.temperaturaMax}°C`
      }
      break
    case 'humedadOptima':
      if (config.validaciones.humedadMin !== undefined && valor < config.validaciones.humedadMin) {
        return `La humedad mínima para ${config.label} es ${config.validaciones.humedadMin}%`
      }
      if (config.validaciones.humedadMax !== undefined && valor > config.validaciones.humedadMax) {
        return `La humedad máxima para ${config.label} es ${config.validaciones.humedadMax}%`
      }
      break
  }
  
  return null
}
