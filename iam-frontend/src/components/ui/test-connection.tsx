'use client'

import { useState } from 'react'
import { sensorService } from '@/lib/services/sensorService'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react'

export function TestConnection() {
  const [isTesting, setIsTesting] = useState(false)
  const [results, setResults] = useState<{
    backend: boolean
    sensores: boolean
    umbrales: boolean
    error?: string
  } | null>(null)

  const testConnection = async () => {
    setIsTesting(true)
    setResults(null)

    try {
      const testResults = {
        backend: false,
        sensores: false,
        umbrales: false
      }

      // Test 1: Conexión básica al backend
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`)
        testResults.backend = response.ok
      } catch (error) {
        console.error('Error testing backend connection:', error)
      }

      // Test 2: Endpoint de sensores
      try {
        await sensorService.obtenerSensores()
        testResults.sensores = true
      } catch (error) {
        console.error('Error testing sensores endpoint:', error)
      }

      // Test 3: Endpoint de umbrales (si hay sensores)
      if (testResults.sensores) {
        try {
          const sensores = await sensorService.obtenerSensores()
          if (sensores.length > 0) {
            await sensorService.obtenerUmbralesSensor(sensores[0].id)
            testResults.umbrales = true
          }
        } catch (error) {
          console.error('Error testing umbrales endpoint:', error)
        }
      }

      setResults(testResults)
    } catch (error) {
      setResults({
        backend: false,
        sensores: false,
        umbrales: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test de Conexión Backend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Probando conexión...
            </>
          ) : (
            'Probar Conexión'
          )}
        </Button>

        {results && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {results.backend ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={results.backend ? 'text-green-600' : 'text-red-600'}>
                Conexión Backend: {results.backend ? '✅ Conectado' : '❌ Falló'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {results.sensores ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={results.sensores ? 'text-green-600' : 'text-red-600'}>
                Endpoint Sensores: {results.sensores ? '✅ Funcionando' : '❌ Falló'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {results.umbrales ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={results.umbrales ? 'text-green-600' : 'text-red-600'}>
                Endpoint Umbrales: {results.umbrales ? '✅ Funcionando' : '❌ Falló'}
              </span>
            </div>

            {results.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            )}

            {results.backend && results.sensores && results.umbrales && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ¡Excelente! Todas las conexiones están funcionando correctamente.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
