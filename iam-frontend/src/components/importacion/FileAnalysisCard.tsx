'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FileIcon, DatabaseIcon, ZapIcon, ClockIcon } from 'lucide-react'

interface FileAnalysisProps {
  file: File | null
  tipo: string
  needsWebSocket: boolean
  reason: string
  estimatedRecords?: number
  estimatedTime?: number
}

export default function FileAnalysisCard({
  file,
  tipo,
  needsWebSocket,
  reason,
  estimatedRecords,
  estimatedTime
}: FileAnalysisProps) {
  if (!file) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            Análisis de Archivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Selecciona un archivo para ver el análisis
          </p>
        </CardContent>
      </Card>
    )
  }

  const fileSizeMB = (file.size / 1024 / 1024).toFixed(1)
  const fileSizeKB = file.size > 1024 * 1024 ? null : (file.size / 1024).toFixed(1)

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'productos':
        return 'bg-blue-100 text-blue-800'
      case 'proveedores':
        return 'bg-green-100 text-green-800'
      case 'movimientos':
        return 'bg-purple-100 text-purple-800'
      case 'categorias':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConnectionIcon = () => {
    if (needsWebSocket) {
      return <DatabaseIcon className="h-4 w-4 text-blue-600" />
    }
    return <ZapIcon className="h-4 w-4 text-green-600" />
  }

  const getConnectionText = () => {
    if (needsWebSocket) {
      return 'WebSocket (Tiempo Real)'
    }
    return 'HTTP (Directo)'
  }

  const getConnectionColor = () => {
    if (needsWebSocket) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return 'bg-green-100 text-green-800 border-green-200'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          Análisis de Archivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del archivo */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Archivo</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono">{file.name}</span>
            <Badge variant="outline" className="text-xs">
              {fileSizeKB ? `${fileSizeKB} KB` : `${fileSizeMB} MB`}
            </Badge>
          </div>
        </div>

        {/* Tipo de importación */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Tipo de Importación</h4>
          <Badge className={getTipoColor(tipo)}>
            {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </Badge>
        </div>

        {/* Método de conexión */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Método de Conexión</h4>
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <Badge className={getConnectionColor()}>
              {getConnectionText()}
            </Badge>
          </div>
        </div>

        {/* Razón */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Razón</h4>
          <p className="text-sm text-gray-600">{reason}</p>
        </div>

        {/* Estimaciones */}
        {(estimatedRecords || estimatedTime) && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Estimaciones</h4>
            <div className="grid grid-cols-2 gap-2">
              {estimatedRecords && (
                <div className="flex items-center gap-1 text-sm">
                  <DatabaseIcon className="h-3 w-3 text-gray-500" />
                  <span>{estimatedRecords.toLocaleString()} registros</span>
                </div>
              )}
              {estimatedTime && (
                <div className="flex items-center gap-1 text-sm">
                  <ClockIcon className="h-3 w-3 text-gray-500" />
                  <span>{Math.round(estimatedTime / 1000)}s estimado</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recomendación */}
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
          <h4 className="font-medium text-sm text-gray-700 mb-1">Recomendación</h4>
          <p className="text-sm text-gray-600">
            {needsWebSocket 
              ? 'Este archivo se procesará con seguimiento en tiempo real para una mejor experiencia.'
              : 'Este archivo se procesará directamente para una respuesta rápida.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 