export interface Proveedor {
  id: number
  nombre: string
  email?: string
  telefono?: string
  estado: 'ACTIVO' | 'INACTIVO' | 'ELIMINADO'
  empresaId: number
  createdAt: string
  updatedAt: string
  productos?: {
    id: number
    nombre: string
    stock?: number
  }[]
}

export interface CreateProveedorDto {
  nombre: string
  email?: string
  telefono?: string
}

export interface UpdateProveedorDto {
  nombre?: string
  email?: string
  telefono?: string
} 