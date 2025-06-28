import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  Edit, 
  Trash2,
  Mail,
  Phone,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Proveedor } from '@/types/proveedor'

interface ProveedorCardProps {
  proveedor: Proveedor
  onEliminar: (id: number) => void
  eliminandoId: number | null
  userRol: string
  onEdit?: (proveedor: Proveedor) => void
}

export default function ProveedorCard({
  proveedor,
  onEliminar,
  eliminandoId,
  userRol,
  onEdit
}: ProveedorCardProps) {
  const isAdmin = userRol === 'ADMIN' || userRol === 'SUPERADMIN'
  const productosConStock = proveedor.productos?.filter(p => (p.stock || 0) > 0) || []

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return {
          color: "bg-green-100 text-green-700",
          icon: CheckCircle,
          text: 'Activo'
        }
      case 'INACTIVO':
        return {
          color: "bg-yellow-100 text-yellow-700",
          icon: AlertTriangle,
          text: 'Inactivo'
        }
      case 'ELIMINADO':
        return {
          color: "bg-red-100 text-red-700",
          icon: XCircle,
          text: 'Eliminado'
        }
      default:
        return {
          color: "bg-gray-100 text-gray-700",
          icon: XCircle,
          text: 'Desconocido'
        }
    }
  }

  const estadoInfo = getEstadoInfo(proveedor.estado)
  const EstadoIcon = estadoInfo.icon

  return (
    <Link href={`/dashboard/proveedores/${proveedor.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
        <CardContent className="p-6 relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
                {proveedor.nombre}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                  estadoInfo.color
                )}>
                  <EstadoIcon className="w-3 h-3" />
                  {estadoInfo.text}
                </span>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-2 mb-4">
            {proveedor.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{proveedor.email}</span>
              </div>
            )}
            {proveedor.telefono && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{proveedor.telefono}</span>
              </div>
            )}
          </div>

          {/* Productos asociados */}
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {proveedor.productos?.length || 0} producto(s) asociado(s)
            </span>
          </div>

          {/* Advertencia de productos con stock */}
          {productosConStock.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {productosConStock.length} producto(s) con stock disponible
                </span>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-auto flex flex-col items-center gap-2 w-full">
            <div className="flex items-center justify-center gap-6 w-full">
              {onEdit && (
                <button
                  className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] hover:underline transition-colors"
                  title="Editar proveedor"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit(proveedor)
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              )}
              {isAdmin && proveedor.estado !== 'ELIMINADO' && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEliminar(proveedor.id)
                  }}
                  disabled={eliminandoId === proveedor.id}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:underline transition-colors disabled:opacity-50"
                  title="Eliminar proveedor"
                >
                  <Trash2 className="w-4 h-4" />
                  {eliminandoId === proveedor.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 