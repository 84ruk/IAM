export interface OpcionesProcesamientoConfig {
  maxRegistros: number;
  columnasRequeridas: string[];
  validarEncabezados: boolean;
  ignorarFilasVacias: boolean;
  normalizarEncabezados: boolean;
}

export interface ConfiguracionImportacion {
  productos: OpcionesProcesamientoConfig;
  proveedores: OpcionesProcesamientoConfig;
  movimientos: OpcionesProcesamientoConfig;
}

export const CONFIGURACION_IMPORTACION: ConfiguracionImportacion = {
  productos: {
    maxRegistros: 10000,
    columnasRequeridas: ['nombre', 'stock', 'precioCompra', 'precioVenta'],
    validarEncabezados: true,
    ignorarFilasVacias: true,
    normalizarEncabezados: true,
  },
  proveedores: {
    maxRegistros: 5000,
    columnasRequeridas: ['nombre'],
    validarEncabezados: true,
    ignorarFilasVacias: true,
    normalizarEncabezados: true,
  },
  movimientos: {
    maxRegistros: 10000,
    columnasRequeridas: ['productoId', 'tipo', 'cantidad'],
    validarEncabezados: true,
    ignorarFilasVacias: true,
    normalizarEncabezados: true,
  },
};

export class ImportacionConfigService {
  static getOpcionesProcesamiento(tipo: 'productos' | 'proveedores' | 'movimientos'): OpcionesProcesamientoConfig {
    return CONFIGURACION_IMPORTACION[tipo];
  }

  static getOpcionesProcesamientoProductos(): OpcionesProcesamientoConfig {
    return CONFIGURACION_IMPORTACION.productos;
  }

  static getOpcionesProcesamientoProveedores(): OpcionesProcesamientoConfig {
    return CONFIGURACION_IMPORTACION.proveedores;
  }

  static getOpcionesProcesamientoMovimientos(): OpcionesProcesamientoConfig {
    return CONFIGURACION_IMPORTACION.movimientos;
  }
} 