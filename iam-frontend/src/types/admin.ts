export interface AdminUser {
  id: number
  nombre: string
  email: string
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR'
  activo: boolean
  createdAt: string
  empresa: {
    id: number
    nombre: string
  }
}

export interface CreateUserAdminDto {
  nombre: string
  email: string
  password: string
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR'
  empresaId?: string
}

export interface UpdateUserAdminDto {
  nombre?: string
  email?: string
  password?: string
  rol?: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR'
  empresaId?: string
}

export interface ChangeRoleDto {
  rol: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR'
}

export interface RoleOption {
  value: 'SUPERADMIN' | 'ADMIN' | 'EMPLEADO' | 'PROVEEDOR'
  label: string
} 