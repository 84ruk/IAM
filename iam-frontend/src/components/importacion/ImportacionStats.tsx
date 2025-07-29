'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { TrabajoImportacion } from '@/lib/api/importacion'

interface ImportacionStatsProps {
  trabajos: TrabajoImportacion[]
  isLoading: boolean
  isConnected: boolean
}

export default function ImportacionStats({ trabajos, isLoading, isConnected }: ImportacionStatsProps) {
  const stats = React.useMemo(() => {
    const total = trabajos.length
    const completados = trabajos.filter(t => t.estado === 'completado').length
    const errores = trabajos.filter(t => t.estado === 'error').length
    const enProceso = trabajos.filter(t => t.estado === 'procesando').length
    const pendientes = trabajos.filter(t => t.estado === 'pendiente').length
    const exitoso = total > 0 ? Math.round((completados / total) * 100) : 0

    return {
      total,
      completados,
      errores,
      enProceso,
      pendientes,
      exitoso
    }
  }, [trabajos])

  const statItems = [
    {
      title: 'Total',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Completados',
      value: stats.completados,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'En Proceso',
      value: stats.enProceso + stats.pendientes,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Errores',
      value: stats.errores,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Tasa de Éxito',
      value: `${stats.exitoso}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Estadísticas de Importación
          {!isConnected && (
            <Badge variant="destructive" className="ml-auto">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Sin conexión
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statItems.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.title} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${item.bgColor} mb-2`}>
                  <IconComponent className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                <div className="text-sm text-gray-600">{item.title}</div>
              </div>
            )
          })}
        </div>
        
        {stats.total === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay trabajos de importación aún</p>
            <p className="text-sm">Comienza importando tu primer archivo</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 