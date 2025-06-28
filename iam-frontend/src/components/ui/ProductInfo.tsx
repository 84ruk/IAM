import { formatearCantidadConUnidad, pluralizarUnidad } from '@/lib/pluralization'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductInfoProps {
  stock: number
  unidad: string
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'badge' | 'inline'
}

/**
 * Componente reutilizable para mostrar información de stock con pluralización automática
 */
export const ProductStockInfo = ({ 
  stock, 
  unidad, 
  className, 
  showIcon = true,
  variant = 'default' 
}: ProductInfoProps) => {
  const baseClasses = {
    default: "flex items-center gap-2",
    badge: "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
    inline: "inline-flex items-center gap-1"
  }

  return (
    <div className={cn(baseClasses[variant], className)}>
      {showIcon && <Package className="w-4 h-4" />}
      <span>{formatearCantidadConUnidad(stock, unidad)}</span>
    </div>
  )
}

interface UnitDisplayProps {
  unidad: string
  cantidad?: number
  className?: string
}

/**
 * Componente para mostrar solo la unidad (pluralizada si es necesario)
 */
export const UnitDisplay = ({ 
  unidad, 
  cantidad = 1, 
  className 
}: UnitDisplayProps) => {
  return (
    <span className={cn("capitalize", className)}>
      {pluralizarUnidad(cantidad, unidad)}
    </span>
  )
}

/**
 * Componente para mostrar cantidad con unidad formateada
 */
export const QuantityWithUnit = ({ 
  cantidad, 
  unidad, 
  className 
}: { cantidad: number; unidad: string; className?: string }) => {
  return (
    <span className={cn("font-medium", className)}>
      {formatearCantidadConUnidad(cantidad, unidad)}
    </span>
  )
} 