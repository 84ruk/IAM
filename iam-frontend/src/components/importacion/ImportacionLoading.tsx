'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { 
  Loader2, 
  Upload,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react'

interface ImportacionLoadingProps {
  archivo: File
  progreso?: number
  mensaje?: string
  onCancel?: () => void
  className?: string
}

export const ImportacionLoading: React.FC<ImportacionLoadingProps> = React.memo(({
  archivo,
  progreso = 0,
  mensaje = 'Procesando archivo...',
  onCancel,
  className = ''
}) => {
  return (
    <Card className={`bg-blue-50 border-blue-200 border-2 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <div>
            <CardTitle className="text-lg text-blue-800">
              Procesando importación
            </CardTitle>
            <p className="text-sm text-blue-600">
              {mensaje}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del archivo */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{archivo.name}</p>
              <p className="text-sm text-gray-600">
                {(archivo.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium text-blue-600">{progreso}%</span>
          </div>
          <Progress value={progreso} className="h-3" />
        </div>

        {/* Pasos del proceso */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${
              progreso >= 25 ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {progreso >= 25 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className={`text-sm ${
              progreso >= 25 ? 'text-green-700' : 'text-gray-500'
            }`}>
              Validando archivo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${
              progreso >= 50 ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {progreso >= 50 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className={`text-sm ${
              progreso >= 50 ? 'text-green-700' : 'text-gray-500'
            }`}>
              Procesando datos
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${
              progreso >= 75 ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {progreso >= 75 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className={`text-sm ${
              progreso >= 75 ? 'text-green-700' : 'text-gray-500'
            }`}>
              Guardando registros
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${
              progreso >= 100 ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {progreso >= 100 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className={`text-sm ${
              progreso >= 100 ? 'text-green-700' : 'text-gray-500'
            }`}>
              Finalizando
            </span>
          </div>
        </div>

        {/* Botón de cancelar */}
        {onCancel && (
          <div className="flex justify-center pt-4 border-t border-blue-200">
            <Button
              variant="outline"
              onClick={onCancel}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Cancelar importación
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

ImportacionLoading.displayName = 'ImportacionLoading' 