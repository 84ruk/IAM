import React from 'react'
import { Package, Plus, Filter } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

interface EmptyStateProps {
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  onAgregarProducto: () => void
}

export default function ProductosEmptyState({
  hayFiltrosActivos,
  onLimpiarFiltros,
  onAgregarProducto
}: EmptyStateProps) {
  if (hayFiltrosActivos) {
    return (
      <EmptyState
        icon={Filter}
        title="No se encontraron productos"
        description="Intenta ajustar los filtros de búsqueda para encontrar productos."
        actionLabel="Limpiar filtros"
        onAction={onLimpiarFiltros}
        showAction={true}
        variant="info"
      />
    )
  }

  return (
    <EmptyState
      icon={Package}
      title="No hay productos registrados"
      description="Comienza agregando tu primer producto al inventario para gestionar tu stock."
      actionLabel="Agregar producto"
      onAction={onAgregarProducto}
      showAction={true}
      variant="default"
    />
  )
} 