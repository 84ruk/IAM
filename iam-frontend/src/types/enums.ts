export type TipoIndustria = 'ALIMENTOS' | 'ROPA' | 'ELECTRÓNICA' | 'GENERICA' | 'FARMACIA'

export const TipoIndustriaLabel: Record<TipoIndustria, string> = {
  ALIMENTOS: 'Alimentos',
  ROPA: 'Ropa',
  ELECTRÓNICA: 'Electrónica',
  FARMACIA: 'Farmacia',
  GENERICA: 'Genérica',
}

export type TipoProducto = 'GENERICO' | 'ROPA' | 'ALIMENTO' | 'ELECTRONICO'

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
