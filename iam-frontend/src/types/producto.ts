import { TipoProducto } from './enums'

export interface ProductoFormData {
  nombre: string
  descripcion?: string
  precioCompra: number
  precioVenta: number
  stockMinimo?: number
  stock?: number
  unidad: string
  etiquetas?: string[]
  talla?: string
  color?: string
  temperaturaOptima?: number
  humedadOptima?: number
  ubicacion?: string
  sku?: string
  codigoBarras?: string
  rfid?: string
  tipoProducto?: TipoProducto
  proveedorId?: number
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
    id: number
    nombre: string
    email?: string
    telefono?: string
    estado: string
  }
  etiquetas: string[]
}
