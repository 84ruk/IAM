'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Clock,
  Database,
  FileText,
  CheckCircle,
  Info
} from 'lucide-react'
import { useImportacionGlobal } from '@/context/ImportacionGlobalContext'
import { useToast } from '@/components/ui/Toast'

interface CancelacionTrabajoProps {
  trabajoId: string
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export default function CancelacionTrabajo({
  trabajoId,
  onCancel,
  onSuccess,
  className = ''
}: CancelacionTrabajoProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmacion, setShowConfirmacion] = useState(false)
  const [rollbackInfo, setRollbackInfo] = useState<any>(null)
  
  const { addToast } = useToast()

  const { state } = useImportacionGlobal()

  const trabajo = state.trabajos.find(t => t.id === trabajoId)

  const handleCancelar = async () => {
    if (!trabajo) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/importacion/trabajos/${trabajoId}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al cancelar el trabajo')
      }

      const resultado = await response.json()

      if (resultado.success) {
        // Mostrar información de rollback si está disponible
        if (resultado.rollbackInfo) {
          setRollbackInfo(resultado.rollbackInfo)
        }

        // Mostrar notificación de éxito
        addToast({
          type: 'success',
          title: 'Trabajo cancelado exitosamente',
          message: `Se han revertido ${resultado.rollbackInfo?.registrosRevertidos || 0} registros`,
          duration: 6000
        })

        onSuccess?.()
      } else {
        throw new Error(resultado.message || 'Error desconocido')
      }
    } catch (error) {
      console.error('Error cancelando trabajo:', error)
      
      addToast({
        type: 'error',
        title: 'Error al cancelar',
        message: error instanceof Error ? error.message : 'Error desconocido',
        duration: 8000
      })
    } finally {
      setIsLoading(false)
      setShowConfirmacion(false)
    }
  }

  const getRollbackInfo = () => {
    if (!rollbackInfo) return null

    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Rollback completado</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-700">Registros revertidos:</span>
            <span className="ml-2 font-medium">{rollbackInfo.registrosRevertidos}</span>
          </div>
          <div>
            <span className="text-green-700">Tiempo de rollback:</span>
            <span className="ml-2 font-medium">{rollbackInfo.tiempoRollback}ms</span>
          </div>
          <div>
            <span className="text-green-700">Transacciones:</span>
            <span className="ml-2 font-medium">{rollbackInfo.transaccionesRevertidas}</span>
          </div>
          <div>
            <span className="text-green-700">Estado:</span>
            <span className="ml-2 font-medium text-green-600">Completado</span>
          </div>
        </div>
      </div>
    )
  }

  if (!trabajo) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            Trabajo no encontrado
          </div>
        </CardContent>
      </Card>
    )
  }

  // Solo mostrar para trabajos que se pueden cancelar
  if (!['pendiente', 'procesando'].includes(trabajo.estado)) {
    return null
  }

  return (
    <Card className={`border-red-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-red-800">
              Cancelar Importación
            </CardTitle>
            <p className="text-sm text-red-600">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del trabajo */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Archivo:</span>
              <span className="font-medium">{trabajo.archivoOriginal}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Procesados:</span>
              <span className="font-medium">{trabajo.registrosProcesados}/{trabajo.totalRegistros}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">Exitosos:</span>
              <span className="font-medium">{trabajo.registrosExitosos}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">Errores:</span>
              <span className="font-medium">{trabajo.registrosConError}</span>
            </div>
          </div>
        </div>

        {/* Advertencias */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-yellow-800">
                ¿Estás seguro de que quieres cancelar esta importación?
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Se detendrá el procesamiento inmediatamente</li>
                <li>• Se revertirán los registros ya procesados</li>
                <li>• Se liberarán los recursos del sistema</li>
                <li>• Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Información de rollback */}
        {getRollbackInfo()}

        {/* Botones de acción */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {!showConfirmacion ? (
            <Button
              variant="destructive"
              onClick={() => setShowConfirmacion(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancelar Importación
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                onClick={handleCancelar}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {isLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowConfirmacion(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cerrar
          </Button>
        </div>

        {/* Información adicional */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info className="w-3 h-3" />
          <span>
            El rollback automático revertirá todos los cambios realizados durante esta importación
          </span>
        </div>
      </CardContent>
    </Card>
  )
} 