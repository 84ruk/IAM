import { TipoProducto, TipoProductoConfig } from '@/types/enums'
import { Package, Shirt, Apple, Zap } from 'lucide-react'

interface ProductTypeIconProps {
  tipoProducto: TipoProducto
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const getIcon = (tipo: TipoProducto) => {
  switch (tipo) {
    case 'GENERICO':
      return Package
    case 'ROPA':
      return Shirt
    case 'ALIMENTO':
      return Apple
    case 'ELECTRONICO':
      return Zap
    default:
      return Package
  }
}

export default function ProductTypeIcon({ 
  tipoProducto, 
  showLabel = false, 
  size = 'md' 
}: ProductTypeIconProps) {
  // Validar que el tipoProducto existe en la configuración
  if (!tipoProducto || !TipoProductoConfig[tipoProducto]) {
    console.warn(`TipoProducto no válido: ${tipoProducto}, usando GENERICO como fallback`)
    const config = TipoProductoConfig.GENERICO
    const Icon = getIcon('GENERICO')
    
    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }
    
    const containerSizes = {
      sm: 'p-1',
      md: 'p-1.5',
      lg: 'p-2'
    }

    return (
      <div className={`
        inline-flex items-center gap-1.5 rounded-lg
        ${config.bgColor} ${config.color}
        ${containerSizes[size]}
        font-medium
      `}>
        <Icon className={iconSizes[size]} />
        {showLabel && (
          <span className="text-xs font-medium">
            {config.label}
          </span>
        )}
      </div>
    )
  }

  const config = TipoProductoConfig[tipoProducto]
  const Icon = getIcon(tipoProducto)
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const containerSizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  }

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-lg
      ${config.bgColor} ${config.color}
      ${containerSizes[size]}
      font-medium
    `}>
      <Icon className={iconSizes[size]} />
      {showLabel && (
        <span className="text-xs font-medium">
          {config.label}
        </span>
      )}
    </div>
  )
} 