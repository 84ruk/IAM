export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA'
}

export enum Rol {
  ADMIN = 'ADMIN',
  EMPLEADO = 'EMPLEADO',
  PROVEEDOR = 'PROVEEDOR',
  SUPERADMIN = 'SUPERADMIN'
}

export enum EstadoProducto {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  ELIMINADO = 'ELIMINADO'
}

export enum EstadoProveedor {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  ELIMINADO = 'ELIMINADO'
}

export enum TipoProducto {
  GENERICO = 'GENERICO',
  ROPA = 'ROPA',
  ALIMENTO = 'ALIMENTO',
  ELECTRONICO = 'ELECTRONICO'
}

export enum UnidadMedida {
  UNIDAD = 'UNIDAD',
  KILO = 'KILO',
  LITRO = 'LITRO',
  CAJA = 'CAJA',
  PAQUETE = 'PAQUETE'
}

export type TipoIndustria = 'ALIMENTOS' | 'ROPA' | 'ELECTRONICA' | 'GENERICA' | 'FARMACIA'

export const TipoIndustriaLabel: Record<TipoIndustria, string> = {
  ALIMENTOS: 'Alimentos',
  ROPA: 'Ropa',
  ELECTRONICA: 'Electrónica',
  FARMACIA: 'Farmacia',
  GENERICA: 'Genérica',
}

export const TipoProductoConfig: Record<TipoProducto, {
  label: string
  color: string
  bgColor: string
}> = {
  GENERICO: {
    label: 'Genérico',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  ROPA: {
    label: 'Ropa',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  ALIMENTO: {
    label: 'Alimento',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  ELECTRONICO: {
    label: 'Electrónico',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  }
}
