'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ServerAwareLoader, ServerAwareList } from '@/components/ui/ServerAwareLoader'
import { useServerState, useServerActions } from '@/context/ServerStatusContext'
import { useSmartApiRequest } from '@/hooks/useApiWithRetry'
import { apiClient } from '@/lib/api/apiClient'
import { 
  Server, 
  Zap, 
  RefreshCw, 
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface ExampleData {
  id: string
  name: string
  status: string
  timestamp: string
}

export default function ColdStartExample() {
  const { status, responseTime, retryCount, isWarmingUp } = useServerState()
  const { checkServerStatus, warmUpServer } = useServerActions()
  const [showDetails, setShowDetails] = useState(false)

  // Ejemplo de petición inteligente
  const { 
    data: exampleData, 
    loading, 
    error, 
    smartRequest 
  } = useSmartApiRequest<ExampleData[]>()

  const handleTestRequest = async () => {
    try {
      await smartRequest(() => apiClient.get('/api/example-data'))
    } catch (error) {
      console.error('Error en petición de ejemplo:', error)
    }
  }

  const handleRetryConnection = () => {
    checkServerStatus()
  }

  const handleWarmUpServer = () => {
    warmUpServer()
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
    <div className="space-y-6">
      {/* Header con estado del servidor */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Ejemplo de Manejo de Cold Start
          </h2>
          <p className="text-gray-600 mt-1">
            Demostración de cómo manejar servidores que se apagan por inactividad
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-md ${getStatusColor()} bg-gray-50`}>
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">{status}</span>
          </div>
          
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
          >
            {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
          </Button>
        </div>
      </div>

      {/* Detalles del estado del servidor */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Estado del Servidor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{status}</div>
                <div className="text-sm text-gray-500">Estado</div>
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
            
            <div className="flex gap-2">
              <Button
                onClick={handleRetryConnection}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Verificar Estado
              </Button>
              
              <Button
                onClick={handleWarmUpServer}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isWarmingUp}
              >
                <Zap className="w-4 h-4" />
                {isWarmingUp ? 'Calentando...' : 'Calentar Servidor'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ejemplo de petición con manejo de cold start */}
      <ServerAwareLoader
        isLoading={loading}
        error={error}
        showServerStatus={true}
        onRetry={handleTestRequest}
        onWarmUp={handleWarmUpServer}
      >
        <Card>
          <CardHeader>
            <CardTitle>Petición de Ejemplo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Esta petición maneja automáticamente los cold starts del servidor.
              Si el servidor está apagado, intentará calentarlo antes de hacer la petición.
            </p>
            
            <Button
              onClick={handleTestRequest}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              {loading ? 'Procesando...' : 'Hacer Petición de Prueba'}
            </Button>
            
            {exampleData && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Datos Obtenidos:</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(exampleData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </ServerAwareLoader>

      {/* Ejemplo de lista con manejo de cold start */}
      <Card>
        <CardHeader>
          <CardTitle>Lista con Manejo de Cold Start</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerAwareList
            data={exampleData}
            error={error}
            isLoading={loading}
            renderItem={(item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.status}</div>
                </div>
                <div className="text-sm text-gray-400">{item.timestamp}</div>
              </div>
            )}
            emptyMessage="No hay datos disponibles"
            onRetry={handleTestRequest}
            onWarmUp={handleWarmUpServer}
          />
        </CardContent>
      </Card>

      {/* Información sobre cold starts */}
      <Card>
        <CardHeader>
          <CardTitle>¿Qué son los Cold Starts?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p>
              Los <strong>cold starts</strong> ocurren cuando un servidor en la nube (como Fly.io) 
              se apaga por inactividad para ahorrar recursos. Cuando vuelves a hacer una petición:
            </p>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>El servidor tarda varios segundos en "despertar"</li>
              <li>La primera petición puede fallar o tardar mucho</li>
              <li>Las peticiones posteriores son más rápidas</li>
              <li>Es normal en servicios serverless o con auto-scaling</li>
            </ul>
            
            <p>
              Nuestro sistema detecta automáticamente estos cold starts y:
            </p>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>Muestra un loader animado durante el proceso</li>
              <li>Reintenta las peticiones con delays inteligentes</li>
              <li>Permite calentar el servidor manualmente</li>
              <li>Proporciona feedback visual del estado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 