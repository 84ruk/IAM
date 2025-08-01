import { TipoMovimiento } from './enums'

export interface Movimiento {
  id: number
  tipo: TipoMovimiento
  cantidad: number
  productoId: number
  empresaId: number
  motivo?: string
  descripcion?: string
  estado: 'ACTIVO' | 'ELIMINADO'
  fecha: string
  createdAt: string
  updatedAt: string
  
  // ✅ NUEVO: Campos de precio para tracking financiero
  precioUnitario?: number
  precioTotal?: number
  tipoPrecio?: 'COMPRA' | 'VENTA' | 'AJUSTE' | 'TRANSFERENCIA'
  
  producto?: {
    id: number
    nombre: string
    descripcion?: string
    stock: number
    stockMinimo?: number
    precioCompra: number
    precioVenta: number
    unidad?: string
    etiquetas: string[]
    codigoBarras?: string
    rfid?: string
    sku?: string
    estado: string
    tipoProducto?: string
    proveedor?: {
      id: number
      nombre: string
      email?: string
      telefono?: string
      estado: string
    }
  }
}

export interface CreateMovimientoDto {
  tipo: TipoMovimiento
  cantidad: number
  productoId: number
  proveedorId?: number
  motivo?: string
  descripcion?: string
  
  // ✅ NUEVO: Campos de precio opcionales
  precioUnitario?: number
  precioTotal?: number
  tipoPrecio?: 'COMPRA' | 'VENTA' | 'AJUSTE' | 'TRANSFERENCIA'
}

export interface UpdateMovimientoDto {
  motivo?: string
  descripcion?: string
}

export type MovimientoDetalle = {
  id: number
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  fecha: string
  motivo?: string | null
  descripcion?: string | null
  estado: 'ACTIVO' | 'ELIMINADO'
  
  // ✅ NUEVO: Campos de precio
  precioUnitario?: number | null
  precioTotal?: number | null
  tipoPrecio?: 'COMPRA' | 'VENTA' | 'AJUSTE' | 'TRANSFERENCIA' | null
  
  producto: {
    id: number
    nombre: string
    descripcion?: string | null
    stock: number
    stockMinimo: number
    precioCompra: number
    precioVenta: number
    unidad: string
    etiquetas?: string[]
    codigoBarras?: string | null
    rfid?: string | null
    sku?: string | null
    estado: string
    tipoProducto: string
    proveedor?: {
      id: number
      nombre: string
      email?: string | null
      telefono?: string | null
      estado: string
    } | null
  }
}

export type EstadisticasMovimientos = {
  total: number
  entradas: number
  salidas: number
  hoy: number
}

// ✅ NUEVO: Tipo para estadísticas financieras
export type EstadisticasFinancieras = {
  valorInventario: number
  valorEntradas: number
  valorSalidas: number
  margenPromedio: number
  costoPromedio: number
  ingresosTotales: number
  costosTotales: number
}

export type MovimientosResponse = {
  movimientos: Movimiento[]
  estadisticas: EstadisticasMovimientos
}
