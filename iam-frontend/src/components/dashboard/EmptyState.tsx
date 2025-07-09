import React from 'react'
import { BarChart3, Package, Building2, ArrowLeftRight } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

interface DashboardEmptyStateProps {
  tipo: 'general' | 'productos' | 'proveedores' | 'movimientos'
  onAction?: () => void
}

export default function DashboardEmptyState({ 
  tipo, 
  onAction 
}: DashboardEmptyStateProps) {
  const configs = {
    general: {
      icon: BarChart3,
      title: 'Sin datos para mostrar',
      description: 'Aún no hay información suficiente para mostrar estadísticas en el dashboard. Comienza agregando productos y registrando movimientos.',
      actionLabel: 'Agregar primer producto',
      variant: 'info' as const
    },
    productos: {
      icon: Package,
      title: 'No hay productos',
      description: 'Agrega tu primer producto para comenzar a gestionar tu inventario.',
      actionLabel: 'Agregar producto',
      variant: 'default' as const
    },
    proveedores: {
      icon: Building2,
      title: 'No hay proveedores',
      description: 'Registra proveedores para gestionar tus compras y suministros.',
      actionLabel: 'Agregar proveedor',
      variant: 'default' as const
    },
    movimientos: {
      icon: ArrowLeftRight,
      title: 'No hay movimientos',
      description: 'Los movimientos de inventario aparecerán aquí cuando registres entradas o salidas.',
      actionLabel: 'Registrar movimiento',
      variant: 'default' as const
    }
  }

  const config = configs[tipo]

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      actionLabel={config.actionLabel}
      onAction={onAction}
      showAction={!!onAction}
      variant={config.variant}
    />
  )
} 