'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Package,
  Truck,
  Tag
} from 'lucide-react'
import { ImportacionResultado } from '@/types/importacion'

interface ImportacionStatsProps {
  resultado: ImportacionResultado
}

export default function ImportacionStats({ resultado }: ImportacionStatsProps) {
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'productos':
        return <Package className="w-4 h-4" />
      case 'proveedores':
        return <Truck className="w-4 h-4" />
      case 'movimientos':
        return <Tag className="w-4 h-4" />
      default:
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'productos':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'proveedores':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'movimientos':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const porcentajeExito = resultado.registrosProcesados > 0 
    ? Math.round((resultado.registrosExitosos / resultado.registrosProcesados) * 100)
    : 0

  const porcentajeError = resultado.registrosProcesados > 0 
    ? Math.round((resultado.registrosConError / resultado.registrosProcesados) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total de registros procesados */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Procesados</p>
              <p className="text-2xl font-bold text-gray-900">{resultado.registrosProcesados}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registros exitosos */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Exitosos</p>
              <p className="text-2xl font-bold text-green-600">{resultado.registrosExitosos}</p>
              <p className="text-xs text-gray-500">{porcentajeExito}% del total</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registros con errores */}
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Errores</p>
              <p className="text-2xl font-bold text-red-600">{resultado.registrosConError}</p>
              <p className="text-xs text-gray-500">{porcentajeError}% del total</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipo de importación */}
      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tipo</p>
              <div className="flex items-center gap-2 mt-1">
                {getTipoIcon(resultado.tipoUsado || 'productos')}
                <Badge variant="outline" className={getTipoColor(resultado.tipoUsado || 'productos')}>
                  {resultado.tipoUsado || 'productos'}
                </Badge>
              </div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 