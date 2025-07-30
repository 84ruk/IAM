import { TipoProducto, TipoProductoConfig } from '@/types/enums'
import { 
  Package, 
  Shirt, 
  Apple, 
  Zap, 
  Pill, 
  Heart, 
  Stethoscope, 
  Droplets, 
  FlaskConical, 
  Scissors, 
  Code, 
  Cpu 
} from 'lucide-react'

interface ProductTypeIconProps {
  tipoProducto?: TipoProducto
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const getIcon = (tipo: TipoProducto) => {
  switch (tipo) {
    case TipoProducto.GENERICO:
      return Package
    case TipoProducto.ROPA:
      return Shirt
    case TipoProducto.ALIMENTO:
      return Apple
    case TipoProducto.ELECTRONICO:
      return Zap
    case TipoProducto.MEDICAMENTO:
      return Pill
    case TipoProducto.SUPLEMENTO:
      return Heart
    case TipoProducto.EQUIPO_MEDICO:
      return Stethoscope
    case TipoProducto.CUIDADO_PERSONAL:
      return Droplets
    case TipoProducto.BIOLOGICO:
      return FlaskConical
    case TipoProducto.MATERIAL_QUIRURGICO:
      return Scissors
    case TipoProducto.SOFTWARE:
      return Code
    case TipoProducto.HARDWARE:
      return Cpu
    default:
      return Package
  }
}

export default function ProductTypeIcon({ 
  tipoProducto, 
  showLabel = false, 
  size = 'md' 
}: ProductTypeIconProps) {
  // Si no hay tipoProducto, no mostrar nada
  if (!tipoProducto) {
    return null
  }

  // Validar que el tipoProducto existe en la configuración
  if (!TipoProductoConfig[tipoProducto]) {
    console.warn(`TipoProducto no válido: ${tipoProducto}, no mostrando icono`)
    return null
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