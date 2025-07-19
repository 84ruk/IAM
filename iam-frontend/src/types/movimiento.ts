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

export type MovimientosResponse = {
  movimientos: Movimiento[]
  estadisticas: EstadisticasMovimientos
}
