import { TipoProducto } from './enums'

export interface ProductoFormData {
  nombre: string
  descripcion?: string
  precioCompra: number
  precioVenta: number
  stockMinimo?: number
  stock?: number
  unidad: string
  etiqueta?: string
  talla?: string
  color?: string
  temperaturaOptima?: number
  humedadOptima?: number
  ubicacion?: string
  sku?: string
  codigoBarras?: string
  rfid?: string
  tipoProducto?: TipoProducto
}

// Tipo completo para productos del backend
export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precioCompra: number
  precioVenta: number
  stock: number
  stockMinimo: number
  unidad: string
  etiqueta?: string
  estado: 'ACTIVO' | 'INACTIVO' | 'ELIMINADO'
  empresaId: number
  proveedorId?: number
  creadoEn: string
  actualizadoEn: string
  codigoBarras?: string
  rfid?: string
  sku?: string
  ubicacion?: string
  tipoProducto: TipoProducto
  talla?: string
  color?: string
  temperaturaOptima?: number
  humedadOptima?: number
  proveedor?: {
    nombre: string
  }
}
