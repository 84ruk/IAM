'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Thermometer, Droplets, Weight, Gauge, Settings, Save, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface UmbralesSensor {
  temperaturaMin?: number
  temperaturaMax?: number
  humedadMin?: number
  humedadMax?: number
  pesoMin?: number
  pesoMax?: number
  presionMin?: number
  presionMax?: number
  alertasActivas: boolean
  mensajeAlerta: string
  mensajeCritico: string
  destinatarios: string[]
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  intervaloVerificacionMinutos: number
  notificacionEmail: boolean
  notificacionSMS: boolean
  notificacionWebSocket: boolean
}

interface ConfiguracionUmbralesProps {
  sensorId: number
  sensorTipo: string
  valoresActuales?: Partial<UmbralesSensor>
  onConfiguracionGuardada: (umbrales: UmbralesSensor) => void
}

export function ConfiguracionUmbrales({ sensorId, sensorTipo, valoresActuales, onConfiguracionGuardada }: ConfiguracionUmbralesProps) {
  const { authInfo, getAuthHeaders } = useAuth()
  
  // Función para obtener umbrales por defecto según el tipo de sensor
  const getUmbralesPorDefecto = (tipo: string): UmbralesSensor => {
    const baseUmbrales = {
      alertasActivas: true,
      mensajeAlerta: 'Valor fuera del rango normal',
      mensajeCritico: 'Valor crítico detectado',
      destinatarios: [],
      severidad: 'MEDIA' as const,
      intervaloVerificacionMinutos: 5,
      notificacionEmail: true,
      notificacionSMS: false,
      notificacionWebSocket: true
    }

    switch (tipo.toUpperCase()) {
      case 'TEMPERATURA':
        return {
          ...baseUmbrales,
          temperaturaMin: 15,
          temperaturaMax: 25,
          humedadMin: undefined,
          humedadMax: undefined,
          pesoMin: undefined,
          pesoMax: undefined,
          presionMin: undefined,
          presionMax: undefined
        }
      case 'HUMEDAD':
        return {
          ...baseUmbrales,
          temperaturaMin: undefined,
          temperaturaMax: undefined,
          humedadMin: 40,
          humedadMax: 60,
          pesoMin: undefined,
          pesoMax: undefined,
          presionMin: undefined,
          presionMax: undefined
        }
      case 'PESO':
        return {
          ...baseUmbrales,
          temperaturaMin: undefined,
          temperaturaMax: undefined,
          humedadMin: undefined,
          humedadMax: undefined,
          pesoMin: 100,
          pesoMax: 900,
          presionMin: undefined,
          presionMax: undefined
        }
      case 'PRESION':
        return {
          ...baseUmbrales,
          temperaturaMin: undefined,
          temperaturaMax: undefined,
          humedadMin: undefined,
          humedadMax: undefined,
          pesoMin: undefined,
          pesoMax: undefined,
          presionMin: 1000,
          presionMax: 1500
        }
      default:
        return {
          ...baseUmbrales,
          temperaturaMin: 15,
          temperaturaMax: 25,
          humedadMin: 40,
          humedadMax: 60,
          pesoMin: 100,
          pesoMax: 900,
          presionMin: 1000,
          presionMax: 1500
        }
    }
  }

  const [umbrales, setUmbrales] = useState<UmbralesSensor>(
    valoresActuales && Object.keys(valoresActuales).length > 0
      ? { ...getUmbralesPorDefecto(sensorTipo), ...valoresActuales }
      : getUmbralesPorDefecto(sensorTipo)
  )

  // Sincronizar umbrales si cambian los valores actuales o el tipo de sensor
  useEffect(() => {
    if (valoresActuales && Object.keys(valoresActuales).length > 0) {
      setUmbrales({ ...getUmbralesPorDefecto(sensorTipo), ...valoresActuales })
    } else {
      setUmbrales(getUmbralesPorDefecto(sensorTipo))
    }
  }, [valoresActuales, sensorTipo])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const cargarUmbrales = useCallback(async () => {
    if (!authInfo.isAuthenticated) {
      setError('Usuario no autenticado')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      // 🚀 NUEVO: Usar la nueva API de umbrales
      const response = await fetch(`${apiUrl}/sensores/${sensorId}/umbrales`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.umbralCritico && data.configuracionNotificacion) {
          // Convertir la respuesta del backend al formato del frontend
          const umbralesConvertidos = {
            temperaturaMin: data.umbralCritico.rango_min,
            temperaturaMax: data.umbralCritico.rango_max,
            humedadMin: data.umbralCritico.rango_min,
            humedadMax: data.umbralCritico.rango_max,
            pesoMin: data.umbralCritico.rango_min,
            pesoMax: data.umbralCritico.rango_max,
            presionMin: data.umbralCritico.rango_min,
            presionMax: data.umbralCritico.rango_max,
            alertasActivas: data.umbralCritico.alertasActivas,
            mensajeAlerta: 'Valor fuera del rango normal',
            mensajeCritico: 'Valor crítico detectado',
            destinatarios: data.destinatarios.map((d: { destinatario: { email: string; telefono: string | null } }) => d.destinatario.email || d.destinatario.telefono).filter(Boolean),
            severidad: data.umbralCritico.severidad,
            intervaloVerificacionMinutos: Math.floor(data.umbralCritico.intervalo_lectura / 60000),
            notificacionEmail: data.configuracionNotificacion.email,
            notificacionSMS: data.configuracionNotificacion.sms,
            notificacionWebSocket: data.configuracionNotificacion.webSocket
          }
          setUmbrales(umbralesConvertidos)
        }
      } else if (response.status === 401) {
        setError('No autorizado. Por favor, inicia sesión nuevamente.')
      } else {
        setError(`Error al cargar umbrales: ${response.status}`)
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
        setError((err as { message: string }).message);
      } else {
        setError('Error de conexión. Usando configuración por defecto.');
      }
    } finally {
      setIsLoading(false)
    }
  }, [sensorId, authInfo.isAuthenticated, getAuthHeaders, apiUrl]);

  useEffect(() => {
    cargarUmbrales()
  }, [sensorId, authInfo.isAuthenticated, cargarUmbrales])

  const actualizarUmbral = (campo: keyof UmbralesSensor, valor: UmbralesSensor[keyof UmbralesSensor]) => {
    setUmbrales(prev => ({ ...prev, [campo]: valor }))
  }

  const resetearUmbrales = () => {
    setUmbrales(getUmbralesPorDefecto(sensorTipo))
  }

  const validarUmbrales = (): boolean => {
    // Solo validar los campos del tipo de sensor específico
    switch (sensorTipo.toUpperCase()) {
      case 'TEMPERATURA':
        if (umbrales.temperaturaMin !== undefined && umbrales.temperaturaMax !== undefined) {
          if (umbrales.temperaturaMin >= umbrales.temperaturaMax) {
            setError('La temperatura mínima debe ser menor que la máxima')
            return false
          }
        }
        break
      case 'HUMEDAD':
        if (umbrales.humedadMin !== undefined && umbrales.humedadMax !== undefined) {
          if (umbrales.humedadMin >= umbrales.humedadMax) {
            setError('La humedad mínima debe ser menor que la máxima')
            return false
          }
        }
        break
      case 'PESO':
        if (umbrales.pesoMin !== undefined && umbrales.pesoMax !== undefined) {
          if (umbrales.pesoMin >= umbrales.pesoMax) {
            setError('El peso mínimo debe ser menor que el máximo')
            return false
          }
        }
        break
      case 'PRESION':
        if (umbrales.presionMin !== undefined && umbrales.presionMax !== undefined) {
          if (umbrales.presionMin >= umbrales.presionMax) {
            setError('La presión mínima debe ser menor que la máxima')
            return false
          }
        }
        break
      default:
        // Para tipos mixtos, validar todos
        if (umbrales.temperaturaMin !== undefined && umbrales.temperaturaMax !== undefined) {
          if (umbrales.temperaturaMin >= umbrales.temperaturaMax) {
            setError('La temperatura mínima debe ser menor que la máxima')
            return false
          }
        }
        if (umbrales.humedadMin !== undefined && umbrales.humedadMax !== undefined) {
          if (umbrales.humedadMin >= umbrales.humedadMax) {
            setError('La humedad mínima debe ser menor que la máxima')
            return false
          }
        }
        if (umbrales.pesoMin !== undefined && umbrales.pesoMax !== undefined) {
          if (umbrales.pesoMin >= umbrales.pesoMax) {
            setError('El peso mínimo debe ser menor que el máximo')
            return false
          }
        }
        if (umbrales.presionMin !== undefined && umbrales.presionMax !== undefined) {
          if (umbrales.presionMin >= umbrales.presionMax) {
            setError('La presión mínima debe ser menor que la máxima')
            return false
          }
        }
    }
    setError(null)
    return true
  }

  const handleGuardar = async () => {
    if (!validarUmbrales()) return
    if (!authInfo.isAuthenticated) {
      setError('Usuario no autenticado')
      return
    }
    setIsSaving(true)
    try {
      // 🚀 NUEVO: Convertir al formato del backend
      const umbralesBackend = {
        rango_min: umbrales.temperaturaMin || umbrales.humedadMin || umbrales.pesoMin || umbrales.presionMin || 0,
        rango_max: umbrales.temperaturaMax || umbrales.humedadMax || umbrales.pesoMax || umbrales.presionMax || 100,
        umbral_alerta_bajo: (umbrales.temperaturaMin || umbrales.humedadMin || umbrales.pesoMin || umbrales.presionMin || 0) + 5,
        umbral_alerta_alto: (umbrales.temperaturaMax || umbrales.humedadMax || umbrales.pesoMax || umbrales.presionMax || 100) - 5,
        umbral_critico_bajo: umbrales.temperaturaMin || umbrales.humedadMin || umbrales.pesoMin || umbrales.presionMin || 0,
        umbral_critico_alto: umbrales.temperaturaMax || umbrales.humedadMax || umbrales.pesoMax || umbrales.presionMax || 100,
        severidad: umbrales.severidad,
        intervalo_lectura: (umbrales.intervaloVerificacionMinutos || 5) * 60000,
        alertasActivas: umbrales.alertasActivas
      }

      // 🚀 NUEVO: Usar la nueva API de umbrales
      const response = await fetch(`${apiUrl}/sensores/${sensorId}/umbrales`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(umbralesBackend)
      })
      if (response.ok) {
        const data = await response.json()
        if (data.umbralCritico) {
          onConfiguracionGuardada(umbrales)
          setError(null)
          // Assuming addToast is available from a context or imported
          // addToast({
          //   type: 'success',
          //   title: 'Umbrales actualizados',
          //   message: 'La configuración de umbrales se ha guardado correctamente'
          // })
        } else {
          setError(data.message || 'Error al guardar')
        }
      } else if (response.status === 401) {
        setError('No autorizado. Por favor, inicia sesión nuevamente.')
      } else {
        setError(`Error al guardar la configuración: ${response.status}`)
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string') {
        setError((err as { message: string }).message);
      } else {
        setError('Error de conexión');
      }
    } finally {
      setIsSaving(false)
    }
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'TEMPERATURA': return <Thermometer className="h-4 w-4" />
      case 'HUMEDAD': return <Droplets className="h-4 w-4" />
      case 'PESO': return <Weight className="h-4 w-4" />
      case 'PRESION': return <Gauge className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const renderUmbralesTipo = () => {
    switch (sensorTipo) {
      case 'TEMPERATURA':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tempMin">Temperatura Mínima (°C)</Label>
              <Input
                id="tempMin"
                type="number"
                value={umbrales.temperaturaMin ?? ''}
                onChange={(e) => actualizarUmbral('temperaturaMin', parseFloat(e.target.value))}
                placeholder="15"
              />
            </div>
            <div>
              <Label htmlFor="tempMax">Temperatura Máxima (°C)</Label>
              <Input
                id="tempMax"
                type="number"
                value={umbrales.temperaturaMax ?? ''}
                onChange={(e) => actualizarUmbral('temperaturaMax', parseFloat(e.target.value))}
                placeholder="25"
              />
            </div>
          </div>
        )
      case 'HUMEDAD':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="humMin">Humedad Mínima (%)</Label>
              <Input
                id="humMin"
                type="number"
                min="0"
                max="100"
                value={umbrales.humedadMin ?? ''}
                onChange={(e) => actualizarUmbral('humedadMin', parseFloat(e.target.value))}
                placeholder="40"
              />
            </div>
            <div>
              <Label htmlFor="humMax">Humedad Máxima (%)</Label>
              <Input
                id="humMax"
                type="number"
                min="0"
                max="100"
                value={umbrales.humedadMax ?? ''}
                onChange={(e) => actualizarUmbral('humedadMax', parseFloat(e.target.value))}
                placeholder="60"
              />
            </div>
          </div>
        )
      case 'PESO':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pesoMin">Peso Mínimo (kg)</Label>
              <Input
                id="pesoMin"
                type="number"
                min="0"
                value={umbrales.pesoMin ?? ''}
                onChange={(e) => actualizarUmbral('pesoMin', parseFloat(e.target.value))}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="pesoMax">Peso Máximo (kg)</Label>
              <Input
                id="pesoMax"
                type="number"
                min="0"
                value={umbrales.pesoMax ?? ''}
                onChange={(e) => actualizarUmbral('pesoMax', parseFloat(e.target.value))}
                placeholder="900"
              />
            </div>
          </div>
        )
      case 'PRESION':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="presionMin">Presión Mínima (hPa)</Label>
              <Input
                id="presionMin"
                type="number"
                min="0"
                value={umbrales.presionMin ?? ''}
                onChange={(e) => actualizarUmbral('presionMin', parseFloat(e.target.value))}
                placeholder="1000"
              />
            </div>
            <div>
              <Label htmlFor="presionMax">Presión Máxima (hPa)</Label>
              <Input
                id="presionMax"
                type="number"
                min="0"
                value={umbrales.presionMax ?? ''}
                onChange={(e) => actualizarUmbral('presionMax', parseFloat(e.target.value))}
                placeholder="1500"
              />
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tempMin">Temperatura Mínima (°C)</Label>
                <Input
                  id="tempMin"
                  type="number"
                  value={umbrales.temperaturaMin ?? ''}
                  onChange={(e) => actualizarUmbral('temperaturaMin', parseFloat(e.target.value))}
                  placeholder="15"
                />
              </div>
              <div>
                <Label htmlFor="tempMax">Temperatura Máxima (°C)</Label>
                <Input
                  id="tempMax"
                  type="number"
                  value={umbrales.temperaturaMax ?? ''}
                  onChange={(e) => actualizarUmbral('temperaturaMax', parseFloat(e.target.value))}
                  placeholder="25"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="humMin">Humedad Mínima (%)</Label>
                <Input
                  id="humMin"
                  type="number"
                  min="0"
                  max="100"
                  value={umbrales.humedadMin ?? ''}
                  onChange={(e) => actualizarUmbral('humedadMin', parseFloat(e.target.value))}
                  placeholder="40"
                />
              </div>
              <div>
                <Label htmlFor="humMax">Humedad Máxima (%)</Label>
                <Input
                  id="humMax"
                  type="number"
                  min="0"
                  max="100"
                  value={umbrales.humedadMax ?? ''}
                  onChange={(e) => actualizarUmbral('humedadMax', parseFloat(e.target.value))}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pesoMin">Peso Mínimo (kg)</Label>
                <Input
                  id="pesoMin"
                  type="number"
                  min="0"
                  value={umbrales.pesoMin ?? ''}
                  onChange={(e) => actualizarUmbral('pesoMin', parseFloat(e.target.value))}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="pesoMax">Peso Máximo (kg)</Label>
                <Input
                  id="pesoMax"
                  type="number"
                  min="0"
                  value={umbrales.pesoMax ?? ''}
                  onChange={(e) => actualizarUmbral('pesoMax', parseFloat(e.target.value))}
                  placeholder="1500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="presionMin">Presión Mínima (hPa)</Label>
                <Input
                  id="presionMin"
                  type="number"
                  min="0"
                  value={umbrales.presionMin ?? ''}
                  onChange={(e) => actualizarUmbral('presionMin', parseFloat(e.target.value))}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label htmlFor="presionMax">Presión Máxima (hPa)</Label>
                <Input
                  id="presionMax"
                  type="number"
                  min="0"
                  value={umbrales.presionMax ?? ''}
                  onChange={(e) => actualizarUmbral('presionMax', parseFloat(e.target.value))}
                  placeholder="1500"
                />
              </div>
            </div>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIconoTipo(sensorTipo)}
            Configuración de Umbrales - {sensorTipo.toUpperCase()}
          </CardTitle>
          <CardDescription>
            Define los rangos de valores normales y críticos para este sensor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Umbrales específicos del tipo de sensor */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Umbrales de {sensorTipo.toUpperCase()}</h3>
            {renderUmbralesTipo()}
          </div>

          {/* Configuración General */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuración General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="intervalo">Intervalo de Verificación (minutos)</Label>
                <Input
                  id="intervalo"
                  type="number"
                  min="1"
                  max="60"
                  value={umbrales.intervaloVerificacionMinutos ?? ''}
                  onChange={(e) => actualizarUmbral('intervaloVerificacionMinutos', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="severidad">Severidad por Defecto</Label>
                <Select value={umbrales.severidad ?? 'MEDIA'} onValueChange={(value: UmbralesSensor['severidad']) => actualizarUmbral('severidad', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAJA">Baja</SelectItem>
                    <SelectItem value="MEDIA">Media</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="CRITICA">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="alertasActivas"
                checked={umbrales.alertasActivas}
                onCheckedChange={(checked) => actualizarUmbral('alertasActivas', checked)}
              />
              <Label htmlFor="alertasActivas">Alertas Activas</Label>
            </div>
          </div>

          {/* Configuración Avanzada */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setMostrarAvanzado(!mostrarAvanzado)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {mostrarAvanzado ? 'Ocultar' : 'Mostrar'} configuración avanzada
            </button>
            
            {mostrarAvanzado && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mensajeAlerta">Mensaje de Alerta</Label>
                    <Textarea
                      id="mensajeAlerta"
                      value={umbrales.mensajeAlerta}
                      onChange={(e) => actualizarUmbral('mensajeAlerta', e.target.value)}
                      placeholder="Valor fuera del rango normal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mensajeCritico">Mensaje Crítico</Label>
                    <Textarea
                      id="mensajeCritico"
                      value={umbrales.mensajeCritico}
                      onChange={(e) => actualizarUmbral('mensajeCritico', e.target.value)}
                      placeholder="Valor crítico detectado"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Tipos de Notificación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifEmail"
                        checked={umbrales.notificacionEmail}
                        onCheckedChange={(checked) => actualizarUmbral('notificacionEmail', checked)}
                      />
                      <Label htmlFor="notifEmail">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifSMS"
                        checked={umbrales.notificacionSMS}
                        onCheckedChange={(checked) => actualizarUmbral('notificacionSMS', checked)}
                      />
                      <Label htmlFor="notifSMS">SMS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifWebSocket"
                        checked={umbrales.notificacionWebSocket}
                        onCheckedChange={(checked) => actualizarUmbral('notificacionWebSocket', checked)}
                      />
                      <Label htmlFor="notifWebSocket">WebSocket</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={resetearUmbrales}
                disabled={isSaving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetear
              </Button>
              <Badge variant="secondary">Sensor ID: {sensorId}</Badge>
            </div>
            <Button
              onClick={handleGuardar}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
