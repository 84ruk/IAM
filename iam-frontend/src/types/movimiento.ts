// src/types/movimiento.ts

export type Movimiento = {
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
    etiqueta?: string | null
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
    etiqueta?: string | null
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

export type CrearMovimiento = {
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  productoId: number
  motivo?: string
  descripcion?: string
}
