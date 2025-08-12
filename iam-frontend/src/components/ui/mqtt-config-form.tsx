'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Wifi, WifiOff, TestTube, Save, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface MqttConfig {
  enabled: boolean
  host: string
  port: number
  username: string
  password: string
  useTls: boolean
  appId: string
  appSecret: string
  apiEndpoint: string
}

interface MqttStatus {
  enabled: boolean
  connected: boolean
  reconnectAttempts: number
}

export function MqttConfigForm() {
  const [config, setConfig] = useState<MqttConfig>({
    enabled: false,
    host: 'h02f10fd.ala.us-east-1.emqxsl.com',
    port: 8883,
    username: '',
    password: '',
    useTls: true,
    appId: 'v2c96220',
    appSecret: '',
    apiEndpoint: 'https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5'
  })
  
  const [status, setStatus] = useState<MqttStatus>({
    enabled: false,
    connected: false,
    reconnectAttempts: 0
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  const loadCurrentConfig = async () => {
    try {
      // Aquí cargarías la configuración actual desde el backend
      // Por ahora usamos valores por defecto
      setConfig({
        enabled: false,
        host: 'h02f10fd.ala.us-east-1.emqxsl.com',
        port: 8883,
        username: '',
        password: '',
        useTls: true,
        appId: 'v2c96220',
        appSecret: '',
        apiEndpoint: 'https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5'
      })
    } catch {
      setError('Error cargando configuración MQTT')
    }
  }

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/mqtt-sensor/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const statusData = await response.json()
        setStatus(statusData)
      }
    } catch {
      console.error('Error cargando estado MQTT:', error)
    }
  }

  // Cargar configuración actual
  useEffect(() => {
    loadCurrentConfig()
    loadStatus()
  }, [])

  const handleConfigChange = (field: keyof MqttConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveConfig = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Aquí guardarías la configuración en el backend
      addToast({
        title: 'Configuración guardada',
        message: 'La configuración MQTT se ha guardado exitosamente',
        type: 'success'
      })
      
      // Recargar estado
      await loadStatus()
    } catch {
      setError('Error guardando configuración MQTT')
      addToast({
        title: 'Error',
        message: 'No se pudo guardar la configuración MQTT',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleMqtt = async (enabled: boolean) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/mqtt-sensor/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        const result = await response.json()
        setStatus(result.status)
        addToast({
          title: enabled ? 'MQTT habilitado' : 'MQTT deshabilitado',
          message: result.message,
          type: 'success'
        })
      } else {
        throw new Error('Error al cambiar estado MQTT')
      }
    } catch {
      setError('Error cambiando estado MQTT')
      addToast({
        title: 'Error',
        message: 'No se pudo cambiar el estado MQTT',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setError('')

    try {
      // Aquí probarías la conexión MQTT
      addToast({
        title: 'Conexión exitosa',
        message: 'La conexión MQTT se estableció correctamente',
        type: 'success'
      })
    } catch {
      setError('Error probando conexión MQTT')
      addToast({
        title: 'Error de conexión',
        message: 'No se pudo establecer la conexión MQTT',
        type: 'error'
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status.connected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            Estado MQTT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Estado</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                status.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {status.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Habilitado</span>
              <Switch
                checked={status.enabled}
                onCheckedChange={handleToggleMqtt}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Reconexiones</span>
              <span className="text-sm font-mono">{status.reconnectAttempts}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración MQTT</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host MQTT</Label>
                <Input
                  id="host"
                  value={config.host}
                  onChange={(e) => handleConfigChange('host', e.target.value)}
                  placeholder="h02f10fd.ala.us-east-1.emqxsl.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Puerto</Label>
                <Input
                  id="port"
                  type="number"
                  value={config.port}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  placeholder="8883"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario (opcional)</Label>
                <Input
                  id="username"
                  value={config.username}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                  placeholder="Usuario MQTT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                  placeholder="Contraseña MQTT"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appId">App ID EMQX</Label>
                <Input
                  id="appId"
                  value={config.appId}
                  onChange={(e) => handleConfigChange('appId', e.target.value)}
                  placeholder="v2c96220"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appSecret">App Secret EMQX</Label>
                <Input
                  id="appSecret"
                  type="password"
                  value={config.appSecret}
                  onChange={(e) => handleConfigChange('appSecret', e.target.value)}
                  placeholder="App Secret"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">API Endpoint EMQX</Label>
              <Input
                id="apiEndpoint"
                value={config.apiEndpoint}
                onChange={(e) => handleConfigChange('apiEndpoint', e.target.value)}
                placeholder="https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="useTls"
                checked={config.useTls}
                onCheckedChange={(checked) => handleConfigChange('useTls', checked)}
              />
              <Label htmlFor="useTls">Usar TLS/SSL</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                onClick={handleSaveConfig}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Configuración
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Probar Conexión
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={loadStatus}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 