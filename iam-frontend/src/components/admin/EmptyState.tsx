import React from 'react'
import { Users, Filter } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

interface AdminEmptyStateProps {
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  onAgregarUsuario: () => void
  context?: 'usuarios' | 'empresas'
}

export default function AdminEmptyState({
  hayFiltrosActivos,
  onLimpiarFiltros,
  onAgregarUsuario,
  context = 'usuarios'
}: AdminEmptyStateProps) {
  if (hayFiltrosActivos) {
    return (
      <EmptyState
        icon={Filter}
        title="No se encontraron usuarios"
        description="Intenta ajustar los filtros de búsqueda para encontrar usuarios."
        actionLabel="Limpiar filtros"
        onAction={onLimpiarFiltros}
        showAction={true}
        variant="info"
      />
    )
  }

  const configs = {
    usuarios: {
      icon: Users,
      title: 'No hay usuarios registrados',
      description: 'Comienza agregando usuarios al sistema para gestionar permisos y accesos.',
      actionLabel: 'Agregar usuario'
    },
    empresas: {
      icon: Users,
      title: 'No hay empresas registradas',
      description: 'Aún no hay empresas configuradas en el sistema.',
      actionLabel: 'Ver empresas'
    }
  }

  const config = configs[context]

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      actionLabel={config.actionLabel}
      onAction={onAgregarUsuario}
      showAction={true}
      variant="default"
    />
  )
} 