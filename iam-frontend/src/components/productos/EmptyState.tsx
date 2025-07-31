import React from 'react'
import { Package, Filter } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'


interface EmptyStateProps {
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  onAgregarProducto: () => void
  totalProductos?: number
  paginaActual?: number
  totalPaginas?: number
}

export default function ProductosEmptyState({
  hayFiltrosActivos,
  onLimpiarFiltros,
  onAgregarProducto,
  totalProductos = 0,
  paginaActual = 1,
  totalPaginas = 1
}: EmptyStateProps) {
  // Si hay productos en total pero no en esta página, mostrar mensaje de paginación
  if (totalProductos > 0 && paginaActual > totalPaginas) {
    return (
      <EmptyState
        icon={Package}
        title="Página no encontrada"
        description={`La página ${paginaActual} no existe. Hay ${totalProductos} productos en ${totalPaginas} página${totalPaginas > 1 ? 's' : ''}.`}
        actionLabel="Ir a la primera página"
        onAction={() => onLimpiarFiltros()}
        showAction={true}
        variant="warning"
      />
    )
  }

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