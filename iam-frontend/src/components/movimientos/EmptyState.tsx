import React from 'react'
import { ArrowLeftRight, Filter, Plus } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

interface EmptyStateProps {
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  onAgregarMovimiento: () => void
}

export default function MovimientosEmptyState({
  hayFiltrosActivos,
  onLimpiarFiltros,
  onAgregarMovimiento
}: EmptyStateProps) {
  if (hayFiltrosActivos) {
    return (
      <EmptyState
        icon={Filter}
        title="No se encontraron movimientos"
        description="Intenta ajustar los filtros de búsqueda para encontrar movimientos de inventario."
        actionLabel="Limpiar filtros"
        onAction={onLimpiarFiltros}
        showAction={true}
        variant="info"
      />
    )
  }

  return (
    <EmptyState
      icon={ArrowLeftRight}
      title="No hay movimientos registrados"
      description="Los movimientos de inventario aparecerán aquí cuando registres entradas o salidas de productos."
      actionLabel="Registrar movimiento"
      onAction={onAgregarMovimiento}
      showAction={true}
      variant="default"
    />
  )
} 