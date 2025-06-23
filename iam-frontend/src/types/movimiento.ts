// src/types/movimiento.ts

export type Movimiento = {
  id: number
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  fecha: string
  motivo?: string | null
  descripcion?: string | null
  producto: {
    nombre: string
    categoria?: string | null
    unidad: string
  }
}

export type CrearMovimiento = {
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  productoId: number
  motivo?: string
  descripcion?: string
}
