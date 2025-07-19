// Configuración dinámica para gráficas del sistema
export interface GraphLabels {
  entradas: string
  salidas: string
  balance: string
  cantidad: string
  diaDelMes: string
  unidades: string
}

export interface GraphColors {
  entradas: string
  salidas: string
  balance: string
}

export interface GraphTooltips {
  entradas: string
  salidas: string
  balance: string
}

export interface GraphConfig {
  labels: GraphLabels
  colors: GraphColors
  tooltips: GraphTooltips
}

// Configuración por defecto en español
export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  labels: {
    entradas: 'Entradas',
    salidas: 'Salidas',
    balance: 'Balance',
    cantidad: 'Cantidad',
    diaDelMes: 'Día del mes',
    unidades: 'unidades'
  },
  colors: {
    entradas: '#4ECDC4',
    salidas: '#FF6B6B',
    balance: '#8E94F2'
  },
  tooltips: {
    entradas: 'Entradas',
    salidas: 'Salidas',
    balance: 'Balance'
  }
}

// Configuración alternativa en inglés (para futura internacionalización)
export const ENGLISH_GRAPH_CONFIG: GraphConfig = {
  labels: {
    entradas: 'Inputs',
    salidas: 'Outputs',
    balance: 'Balance',
    cantidad: 'Quantity',
    diaDelMes: 'Day of month',
    unidades: 'units'
  },
  colors: {
    entradas: '#4ECDC4',
    salidas: '#FF6B6B',
    balance: '#8E94F2'
  },
  tooltips: {
    entradas: 'Inputs',
    salidas: 'Outputs',
    balance: 'Balance'
  }
}

// Función para obtener configuración según idioma
export function getGraphConfig(language: string = 'es'): GraphConfig {
  switch (language.toLowerCase()) {
    case 'en':
      return ENGLISH_GRAPH_CONFIG
    case 'es':
    default:
      return DEFAULT_GRAPH_CONFIG
  }
}

// Función para personalizar configuración
export function createCustomGraphConfig(
  customLabels?: Partial<GraphLabels>,
  customColors?: Partial<GraphColors>,
  customTooltips?: Partial<GraphTooltips>
): GraphConfig {
  return {
    labels: { ...DEFAULT_GRAPH_CONFIG.labels, ...customLabels },
    colors: { ...DEFAULT_GRAPH_CONFIG.colors, ...customColors },
    tooltips: { ...DEFAULT_GRAPH_CONFIG.tooltips, ...customTooltips }
  }
} 