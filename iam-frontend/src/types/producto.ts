export interface ProductoFormData {
  nombre: string
  descripcion?: string
  precioCompra: number
  precioVenta: number
  stockMinimo?: number
  stock?: number
  unidad: string
  categoria?: string
  talla?: string
  color?: string
  temperaturaOptima?: number
  humedadOptima?: number
  ubicacion?: string
  sku?: string
  codigoBarras?: string
  rfid?: string
}
