export interface AlimentosKPIs {
  productosPerecederos: number;
  productosCaducidadProxima: number;
  productosFIFO: number;
  alertasTemperatura: number;
  alertasHumedad: number;
  tiempoPromedioAlmacen: number;
  productosCaducados: number;
  eficienciaFIFO: number;
  condicionesOptimas: {
    temperatura: number;
    humedad: number;
  };
}

export interface FarmaciaKPIs {
  medicamentosControlados: number;
  medicamentosVencimientoProximo: number;
  lotesActivos: number;
  trazabilidadCompleta: number;
  cumplimientoNormativo: number;
  medicamentosCaducados: number;
  alertasVencimiento: number;
  rotacionMedicamentos: number;
  controlLotes: {
    totalLotes: number;
    lotesVigentes: number;
    lotesVencidos: number;
  };
}

export interface RopaKPIs {
  productosPorTemporada: {
    actual: number;
    anterior: number;
    siguiente: number;
  };
  tallasMasVendidas: Array<{
    talla: string;
    cantidad: number;
    porcentaje: number;
  }>;
  coloresMasVendidos: Array<{
    color: string;
    cantidad: number;
    porcentaje: number;
  }>;
  rotacionPorTemporada: number;
  stockPorTemporada: {
    actual: number;
    anterior: number;
    siguiente: number;
  };
  margenPorColeccion: number;
}

export interface ElectronicaKPIs {
  productosConSKU: number;
  productosConSerie: number;
  rotacionGadgets: number;
  productosDiscontinuados: number;
  controlCalidad: number;
  garantiasActivas: number;
  productosRetornados: number;
  eficienciaSKU: number;
  controlInventario: {
    totalSKUs: number;
    SKUsActivos: number;
    SKUsDiscontinuados: number;
  };
}

export interface OperationalKPIs {
  eficienciaAlmacen: number;
  tiempoPromedioMovimiento: number;
  productosMasMovidos: number;
  rutasMasEficientes: number;
  sobrestock: number;
  quiebresStock: number;
  precisionInventario: number;
  automatizacion: number;
  metricasOperativas: {
    movimientosPorHora: number;
    productosPorUbicacion: number;
    tiempoPromedioProcesamiento: number;
  };
}

export interface SupplierKPIs {
  proveedoresActivos: number;
  cumplimientoProveedores: number;
  precioPromedioProveedor: number;
  tiempoEntregaPromedio: number;
  calidadProveedores: number;
  proveedoresCriticos: number;
  metricasProveedor: Array<{
    proveedorId: number;
    nombre: string;
    productos: number;
    precioPromedio: number;
    cumplimiento: number;
    tiempoEntrega: number;
  }>;
}

export interface ProfitabilityKPIs {
  margenBrutoTotal: number;
  margenNetoTotal: number;
  rentabilidadPorProducto: Array<{
    productoId: number;
    nombre: string;
    margenBruto: number;
    margenNeto: number;
    rentabilidad: number;
  }>;
  rentabilidadPorCategoria: Array<{
    categoria: string;
    margenBruto: number;
    margenNeto: number;
    rentabilidad: number;
  }>;
  productosMasRentables: Array<{
    productoId: number;
    nombre: string;
    rentabilidad: number;
  }>;
  productosMenosRentables: Array<{
    productoId: number;
    nombre: string;
    rentabilidad: number;
  }>;
}

export interface SensorKPIs {
  sensoresActivos: number;
  alertasActivas: number;
  condicionesOptimas: number;
  sensoresTemperatura: number;
  sensoresHumedad: number;
  sensoresPresion: number;
  sensoresPeso: number;
  metricasSensores: {
    temperaturaPromedio: number;
    humedadPromedio: number;
    presionPromedio: number;
    pesoPromedio: number;
  };
  alertasPorTipo: {
    temperatura: number;
    humedad: number;
    presion: number;
    peso: number;
  };
}

export interface PredictiveKPIs {
  prediccionDemanda: Array<{
    productoId: number;
    nombre: string;
    demandaEstimada: number;
    confianza: number;
  }>;
  prediccionQuiebres: Array<{
    productoId: number;
    nombre: string;
    fechaPrediccion: Date;
    probabilidad: number;
  }>;
  tendenciasVentas: {
    tendencia: 'CRECIENTE' | 'ESTABLE' | 'DECRECIENTE';
    porcentajeCambio: number;
    periodo: string;
  };
  estacionalidad: Array<{
    mes: string;
    factorEstacional: number;
  }>;
} 