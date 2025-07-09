import React from 'react'
import { Building2, Filter } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

interface EmptyStateProps {
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  onAgregarProveedor: () => void
}

export default function ProveedoresEmptyState({
  hayFiltrosActivos,
  onLimpiarFiltros,
  onAgregarProveedor
}: EmptyStateProps) {
  if (hayFiltrosActivos) {
    return (
      <EmptyState
        icon={Filter}
        title="No se encontraron proveedores"
        description="Intenta ajustar los filtros de búsqueda para encontrar proveedores."
        actionLabel="Limpiar filtros"
        onAction={onLimpiarFiltros}
        showAction={true}
        variant="info"
      />
    )
  }

  return (
    <EmptyState
      icon={Building2}
      title="No hay proveedores registrados"
      description="Comienza agregando tu primer proveedor al sistema para gestionar tus compras y suministros."
      actionLabel="Agregar proveedor"
      onAction={onAgregarProveedor}
      showAction={true}
      variant="default"
    />
  )
} 