import { TipoIndustria } from '@prisma/client';

export interface IndustriaConfig {
  nombre: string;
  descripcion: string;
  kpisEspecificos: string[];
  camposRequeridos: string[];
  validaciones: string[];
  alertas: string[];
  sensores: string[];
  colores: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const INDUSTRIA_CONFIG: Record<TipoIndustria, IndustriaConfig> = {
  GENERICA: {
    nombre: 'Genérica',
    descripcion: 'Empresas con flujos simples de inventario',
    kpisEspecificos: [
      'totalProductos',
      'valorInventario',
      'rotacionPromedio',
      'margenPromedio'
    ],
    camposRequeridos: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
    validaciones: ['stock >= 0', 'precioCompra > 0', 'precioVenta > precioCompra'],
    alertas: ['stockBajo', 'sobrestock'],
    sensores: [],
    colores: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#60A5FA'
    }
  },
  ALIMENTOS: {
    nombre: 'Alimentos',
    descripcion: 'Productos perecederos con control de temperatura y humedad',
    kpisEspecificos: [
      'productosPerecederos',
      'productosCaducidadProxima',
      'alertasTemperatura',
      'alertasHumedad',
      'tiempoPromedioAlmacen',
      'eficienciaFIFO'
    ],
    camposRequeridos: [
      'nombre', 'stock', 'precioCompra', 'precioVenta',
      'temperaturaOptima', 'humedadOptima'
    ],
    validaciones: [
      'stock >= 0',
      'precioCompra > 0',
      'precioVenta > precioCompra',
      'temperaturaOptima >= -20 && temperaturaOptima <= 40',
      'humedadOptima >= 0 && humedadOptima <= 100'
    ],
    alertas: [
      'stockBajo',
      'temperaturaAlta',
      'humedadCritica',
      'caducidadProxima',
      'productoCaducado'
    ],
    sensores: ['TEMPERATURA', 'HUMEDAD'],
    colores: {
      primary: '#10B981',
      secondary: '#059669',
      accent: '#34D399'
    }
  },
  FARMACIA: {
    nombre: 'Farmacia',
    descripcion: 'Control de medicamentos con trazabilidad y cumplimiento normativo',
    kpisEspecificos: [
      'medicamentosControlados',
      'medicamentosVencimientoProximo',
      'lotesActivos',
      'trazabilidadCompleta',
      'cumplimientoNormativo',
      'controlLotes'
    ],
    camposRequeridos: [
      'nombre', 'stock', 'precioCompra', 'precioVenta',
      'codigoBarras', 'rfid'
    ],
    validaciones: [
      'stock >= 0',
      'precioCompra > 0',
      'precioVenta > precioCompra',
      'codigoBarras != null',
      'rfid != null'
    ],
    alertas: [
      'stockBajo',
      'vencimientoProximo',
      'medicamentoCaducado',
      'loteVencido',
      'trazabilidadIncompleta'
    ],
    sensores: ['TEMPERATURA', 'HUMEDAD'],
    colores: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#A78BFA'
    }
  },
  ROPA: {
    nombre: 'Ropa',
    descripcion: 'Gestión de tallas, colores y temporadas',
    kpisEspecificos: [
      'productosPorTemporada',
      'tallasMasVendidas',
      'coloresMasVendidos',
      'rotacionPorTemporada',
      'stockPorTemporada',
      'margenPorColeccion'
    ],
    camposRequeridos: [
      'nombre', 'stock', 'precioCompra', 'precioVenta',
      'color', 'talla'
    ],
    validaciones: [
      'stock >= 0',
      'precioCompra > 0',
      'precioVenta > precioCompra',
      'color != null',
      'talla != null'
    ],
    alertas: [
      'stockBajo',
      'tallaAgotada',
      'colorAgotado',
      'temporadaTerminando',
      'sobrestockTemporada'
    ],
    sensores: [],
    colores: {
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FBBF24'
    }
  },
  ELECTRONICA: {
    nombre: 'Electrónica',
    descripcion: 'Control de SKU, series únicas y garantías',
    kpisEspecificos: [
      'productosConSKU',
      'productosConSerie',
      'rotacionGadgets',
      'controlCalidad',
      'garantiasActivas',
      'eficienciaSKU'
    ],
    camposRequeridos: [
      'nombre', 'stock', 'precioCompra', 'precioVenta',
      'sku', 'rfid'
    ],
    validaciones: [
      'stock >= 0',
      'precioCompra > 0',
      'precioVenta > precioCompra',
      'sku != null',
      'rfid != null'
    ],
    alertas: [
      'stockBajo',
      'productoDiscontinuado',
      'garantiaVencida',
      'controlCalidadFallido',
      'serieDuplicada'
    ],
    sensores: ['TEMPERATURA', 'PRESION'],
    colores: {
      primary: '#EF4444',
      secondary: '#DC2626',
      accent: '#F87171'
    }
  }
};

export function getIndustriaConfig(tipo: TipoIndustria): IndustriaConfig {
  return INDUSTRIA_CONFIG[tipo] || INDUSTRIA_CONFIG.GENERICA;
}

export function getKPIsByIndustria(tipo: TipoIndustria): string[] {
  const config = getIndustriaConfig(tipo);
  return [
    ...config.kpisEspecificos,
    'totalProductos',
    'valorInventario',
    'rotacionPromedio',
    'margenPromedio'
  ];
}

export function getAlertasByIndustria(tipo: TipoIndustria): string[] {
  const config = getIndustriaConfig(tipo);
  return config.alertas;
}

export function getSensoresByIndustria(tipo: TipoIndustria): string[] {
  const config = getIndustriaConfig(tipo);
  return config.sensores;
}

export function validateProductoByIndustria(
  tipo: TipoIndustria,
  producto: any
): { isValid: boolean; errors: string[] } {
  const config = getIndustriaConfig(tipo);
  const errors: string[] = [];

  // Validar campos requeridos
  for (const campo of config.camposRequeridos) {
    if (!producto[campo] && producto[campo] !== 0) {
      errors.push(`El campo ${campo} es requerido para la industria ${config.nombre}`);
    }
  }

  // Validar reglas específicas
  if (tipo === 'ALIMENTOS') {
    if (producto.temperaturaOptima && (producto.temperaturaOptima < -20 || producto.temperaturaOptima > 40)) {
      errors.push('La temperatura óptima debe estar entre -20°C y 40°C');
    }
    if (producto.humedadOptima && (producto.humedadOptima < 0 || producto.humedadOptima > 100)) {
      errors.push('La humedad óptima debe estar entre 0% y 100%');
    }
  }

  if (tipo === 'FARMACIA') {
    if (!producto.codigoBarras) {
      errors.push('Los medicamentos deben tener código de barras para trazabilidad');
    }
    if (!producto.rfid) {
      errors.push('Los medicamentos deben tener RFID para control de lotes');
    }
  }

  if (tipo === 'ROPA') {
    if (!producto.color) {
      errors.push('Los productos de ropa deben especificar el color');
    }
    if (!producto.talla) {
      errors.push('Los productos de ropa deben especificar la talla');
    }
  }

  if (tipo === 'ELECTRONICA') {
    if (!producto.sku) {
      errors.push('Los productos electrónicos deben tener SKU');
    }
    if (!producto.rfid) {
      errors.push('Los productos electrónicos deben tener RFID para control de series');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getIndustriaColors(tipo: TipoIndustria) {
  const config = getIndustriaConfig(tipo);
  return config.colores;
}
