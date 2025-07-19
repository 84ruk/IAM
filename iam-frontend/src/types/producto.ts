import { TipoProducto } from './enums'

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precioCompra: number
  precioVenta: number
  stock: number
  stockMinimo?: number
  unidad?: string
  etiquetas: string[]
  codigoBarras?: string
  rfid?: string
  sku?: string
  estado: 'ACTIVO' | 'INACTIVO' | 'ELIMINADO'
  tipoProducto?: TipoProducto
  temperaturaOptima?: number
  humedadOptima?: number
  talla?: string
  color?: string
  version: number
  empresaId: number
  proveedorId?: number
  createdAt: string
  updatedAt: string
  proveedor?: {
    id: number
    nombre: string
    email?: string
    telefono?: string
  }
}

export interface CreateProductoDto {
  nombre: string
  descripcion?: string
  proveedorId?: number
  precioCompra: number
  precioVenta: number
  stock?: number
  stockMinimo?: number
  unidad?: string
  etiquetas?: string[]
  codigoBarras?: string
  rfid?: string
  sku?: string
  tipoProducto?: TipoProducto
  temperaturaOptima?: number
  humedadOptima?: number
  talla?: string
  color?: string
  }

export interface UpdateProductoDto extends Partial<CreateProductoDto> {}

export interface ProductFilters {
  search?: string
  etiqueta?: string
  estado?: string
  tipoProducto?: string
  agotados?: boolean
  proveedorId?: number
  page?: number
  limit?: number
  temperaturaMin?: number
  temperaturaMax?: number
  humedadMin?: number
  humedadMax?: number
  talla?: string
  color?: string
  sku?: string
  codigoBarras?: string
}

export interface ProductsResponse {
  productos: Producto[]
  total: number
  page: number
  limit: number
  totalPages: number
}
