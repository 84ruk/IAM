'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useServerState, useServerActions } from '@/context/ServerStatusContext'
import { apiClient } from '@/lib/api/apiClient'
import { 
  Server, 
  Zap, 
  RefreshCw, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Bug
} from 'lucide-react'

export default function ServerStatusDebug() {
  const { status, responseTime, retryCount, isWarmingUp } = useServerState()
  const { checkServerStatus, warmUpServer } = useServerActions()
  const [testResult, setTestResult] = useState<string>('')
  const [isTesting, setIsTesting] = useState(false)

  const handleTestHealth = async () => {
    setIsTesting(true)
    setTestResult('')
    
    try {
      const startTime = Date.now()
      const result = await apiClient.checkServerHealth()
      const endTime = Date.now()
      
      setTestResult(JSON.stringify({
        ...result,
        clientTime: endTime - startTime
      }, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handleTestWarmUp = async () => {
    setIsTesting(true)
    setTestResult('')
    
    try {
      await warmUpServer()
      setTestResult('Warm up completado')
    } catch (error) {
      setTestResult(`Error en warm up: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'online': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cold-start': return <Zap className="w-5 h-5 text-orange-500" />
      case 'offline': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-600'
      case 'cold-start': return 'text-orange-600'
      case 'offline': return 'text-red-600'
      case 'error': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Debug del Estado del Servidor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado actual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor()}`}>
                {getStatusIcon()}
              </div>
              <div className="text-sm text-gray-500">{status}</div>
            </div>
            
            {responseTime && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{responseTime}ms</div>
                <div className="text-sm text-gray-500">Tiempo de Respuesta</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{retryCount}</div>
              <div className="text-sm text-gray-500">Reintentos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {isWarmingUp ? (
                  <Activity className="w-6 h-6 text-orange-500 animate-pulse mx-auto" />
                ) : (
                  'No'
                )}
              </div>
              <div className="text-sm text-gray-500">Calentando</div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={checkServerStatus}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Verificar Estado
            </Button>
            
            <Button
              onClick={handleTestHealth}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isTesting}
            >
              <Server className="w-4 h-4" />
              {isTesting ? 'Probando...' : 'Test Health'}
            </Button>
            
            <Button
              onClick={handleTestWarmUp}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isTesting}
            >
              <Zap className="w-4 h-4" />
              {isTesting ? 'Calentando...' : 'Test Warm Up'}
            </Button>
          </div>

          {/* Resultado de la prueba */}
          {testResult && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Resultado de la Prueba:</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-40">
                {testResult}
              </pre>
            </div>
          )}

          {/* Información de debug */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Información de Debug:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• API URL: {process.env.NEXT_PUBLIC_API_URL || 'No configurado'}</li>
              <li>• Estado actual: {status}</li>
              <li>• Tiempo de respuesta: {responseTime ? `${responseTime}ms` : 'No disponible'}</li>
              <li>• Reintentos: {retryCount}</li>
              <li>• Calentando: {isWarmingUp ? 'Sí' : 'No'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 