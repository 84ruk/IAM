export interface Proveedor {
  id: number
  nombre: string
  email?: string
  telefono?: string
  empresaId: number
  estado: 'ACTIVO' | 'INACTIVO' | 'ELIMINADO'
  productos?: {
    id: number
    nombre: string
    stock?: number
  }[]
}

export interface CrearProveedorDto {
  nombre: string
  email?: string
  telefono?: string
}

export interface ActualizarProveedorDto {
  nombre?: string
  email?: string
  telefono?: string
} 