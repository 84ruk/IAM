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
  ELECTRONICO = 'ELECTRONICO',
  MEDICAMENTO = 'MEDICAMENTO',
  SUPLEMENTO = 'SUPLEMENTO',
  EQUIPO_MEDICO = 'EQUIPO_MEDICO',
  CUIDADO_PERSONAL = 'CUIDADO_PERSONAL',
  BIOLOGICO = 'BIOLOGICO',
  MATERIAL_QUIRURGICO = 'MATERIAL_QUIRURGICO',
  SOFTWARE = 'SOFTWARE',
  HARDWARE = 'HARDWARE'
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
  },
  MEDICAMENTO: {
    label: 'Medicamento',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  SUPLEMENTO: {
    label: 'Suplemento',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  EQUIPO_MEDICO: {
    label: 'Equipo Médico',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  CUIDADO_PERSONAL: {
    label: 'Cuidado Personal',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  BIOLOGICO: {
    label: 'Biológico',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  },
  MATERIAL_QUIRURGICO: {
    label: 'Material Quirúrgico',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  SOFTWARE: {
    label: 'Software',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  HARDWARE: {
    label: 'Hardware',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100'
  }
}
