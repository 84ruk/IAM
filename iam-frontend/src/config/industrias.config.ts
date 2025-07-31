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
  nombre?: string
  descripcion?: string
  icono?: string
  color?: string
  camposRelevantes: CampoProducto[]
  sensoresActivos?: boolean
  mostrarTemperaturaHumedad?: boolean
  mostrarTallaColor?: boolean
  mostrarSKU?: boolean
  mostrarCodigoBarras?: boolean
  mostrarRFID?: boolean
  mostrarEtiquetas?: boolean
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
  configuracionEspecifica: Record<string, unknown>
}

export const INDUSTRIAS: Record<string, IndustriaConfig> = {
  GENERICA: {
    label: 'Genérica',
    nombre: 'Genérica',
    descripcion: 'Configuración estándar para cualquier tipo de negocio',
    icono: '🏢',
    color: '#6B7280',
    camposRelevantes: [],
    mostrarTemperaturaHumedad: false,
    mostrarTallaColor: false,
    mostrarSKU: true,
    mostrarCodigoBarras: true,
    mostrarRFID: false,
    mostrarEtiquetas: true,
    configuracionEspecifica: {}
  },
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
    },
    configuracionEspecifica: {}
  },
  ROPA: {
    label: 'Ropa',
    camposRelevantes: ['talla', 'color'],
    opciones: {
      tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colores: ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Marrón']
    },
    configuracionEspecifica: {}
  },
  ELECTRONICA: {
    label: 'Electrónica',
    camposRelevantes: ['sku', 'codigoBarras', 'rfid'],
    configuracionEspecifica: {}
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
    },
    configuracionEspecifica: {}
  }
}

// Función helper para obtener configuración de industria
export function getIndustriaConfig(tipo: TipoIndustria): IndustriaConfig {
  return INDUSTRIAS[tipo] || INDUSTRIAS.GENERICA
}

// Función helper para validar campos por industria
export function validarCampoPorIndustria(
  campo: CampoProducto, 
  valor: unknown, 
  tipoIndustria: TipoIndustria
): string | null {
  const config = getIndustriaConfig(tipoIndustria)
  
  if (!config.validaciones) return null
  
  switch (campo) {
    case 'temperaturaOptima':
      if (typeof valor !== 'number') return null;
      if (config.validaciones.temperaturaMin !== undefined && valor < config.validaciones.temperaturaMin) {
        return `La temperatura mínima para ${config.label} es ${config.validaciones.temperaturaMin}°C`
      }
      if (config.validaciones.temperaturaMax !== undefined && valor > config.validaciones.temperaturaMax) {
        return `La temperatura máxima para ${config.label} es ${config.validaciones.temperaturaMax}°C`
      }
      break
    case 'humedadOptima':
      if (typeof valor !== 'number') return null;
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
