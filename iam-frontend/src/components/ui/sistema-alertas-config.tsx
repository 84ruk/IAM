'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/switch'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Wifi,
  Save,
  RefreshCw,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Zap,
  Shield
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface ConfiguracionSistemaAlertas {
  // Configuración General
  sistemaActivo: boolean
  modoDebug: boolean
  
  // Configuración de Escalamiento
  escalamientoAutomatico: boolean
  tiempoEscalamientoMinutos: number
  maxNivelEscalamiento: number
  
  // Configuración de Notificaciones
  notificacionEmail: boolean
  notificacionSMS: boolean
  notificacionWebSocket: boolean
  notificacionPush: boolean
  
  // Configuración de Destinatarios
  destinatariosPrincipales: string[]
  destinatariosSupervisores: string[]
  destinatariosAdministradores: string[]
  
  // Configuración de Plantillas
  plantillaEmailAlerta: string
  plantillaEmailCritico: string
  plantillaSMSAlerta: string
  plantillaSMSCritico: string
  
  // Configuración de Retry
  maxIntentosNotificacion: number
  intervaloRetryMinutos: number
  
  // Configuración de Blackout
  horarioBlackoutInicio: string
  horarioBlackoutFin: string
  diasBlackout: string[]
  
  // Configuración de Agrupación
  agruparAlertasSimilares: boolean
  tiempoAgrupacionMinutos: number
  maxAlertasPorGrupo: number
}

interface SistemaAlertasConfigProps {
  configuracion?: ConfiguracionSistemaAlertas
  onSave?: (config: ConfiguracionSistemaAlertas) => Promise<void>
  onTest?: (tipo: 'email' | 'sms' | 'websocket') => Promise<void>
  onComplete?: () => void
  onCancel?: () => void
  isLoading?: boolean
}

const configuracionPorDefecto: ConfiguracionSistemaAlertas = {
  sistemaActivo: true,
  modoDebug: false,
  escalamientoAutomatico: true,
  tiempoEscalamientoMinutos: 15,
  maxNivelEscalamiento: 3,
  notificacionEmail: true,
  notificacionSMS: true,
  notificacionWebSocket: true,
  notificacionPush: false,
  destinatariosPrincipales: [],
  destinatariosSupervisores: [],
  destinatariosAdministradores: [],
  plantillaEmailAlerta: 'Alerta del sistema: {sensor} - {valor} {unidad} - {timestamp}',
  plantillaEmailCritico: 'ALERTA CRÍTICA: {sensor} - {valor} {unidad} - {timestamp} - Requiere atención inmediata',
  plantillaSMSAlerta: 'Alerta: {sensor} - {valor}{unidad}',
  plantillaSMSCritico: 'CRÍTICO: {sensor} - {valor}{unidad}',
  maxIntentosNotificacion: 3,
  intervaloRetryMinutos: 5,
  horarioBlackoutInicio: '22:00',
  horarioBlackoutFin: '07:00',
  diasBlackout: ['saturday', 'sunday'],
  agruparAlertasSimilares: true,
  tiempoAgrupacionMinutos: 10,
  maxAlertasPorGrupo: 5
}

export function SistemaAlertasConfig({ 
  configuracion, 
  onSave, 
  onTest, 
  onComplete,
  onCancel,
  isLoading = false 
}: SistemaAlertasConfigProps) {
  const [config, setConfig] = useState<ConfiguracionSistemaAlertas>({
    ...configuracionPorDefecto,
    ...configuracion
  })
  
  const [destinatariosPrincipalesText, setDestinatariosPrincipalesText] = useState('')
  const [destinatariosSupervisoresText, setDestinatariosSupervisoresText] = useState('')
  const [destinatariosAdministradoresText, setDestinatariosAdministradoresText] = useState('')
  const { addToast } = useToast()

  useEffect(() => {
    // Convertir arrays de destinatarios a texto
    if (config.destinatariosPrincipales && config.destinatariosPrincipales.length > 0) {
      setDestinatariosPrincipalesText(config.destinatariosPrincipales.join(', '))
    }
    if (config.destinatariosSupervisores && config.destinatariosSupervisores.length > 0) {
      setDestinatariosSupervisoresText(config.destinatariosSupervisores.join(', '))
    }
    if (config.destinatariosAdministradores && config.destinatariosAdministradores.length > 0) {
      setDestinatariosAdministradoresText(config.destinatariosAdministradores.join(', '))
    }
  }, [config.destinatariosPrincipales, config.destinatariosSupervisores, config.destinatariosAdministradores])

  const handleDestinatariosChange = (campo: keyof ConfiguracionSistemaAlertas, value: string) => {
    const emails = value.split(',').map(email => email.trim()).filter(email => email)
    setConfig(prev => ({ ...prev, [campo]: emails }))
  }

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave(config)
      }
      addToast({
        type: 'success',
        title: 'Configuración guardada',
        message: 'La configuración del sistema de alertas se ha guardado correctamente'
      })
      if (onComplete) {
        onComplete()
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la configuración'
      })
    }
  }

  const handleTest = async (tipo: 'email' | 'sms' | 'websocket') => {
    try {
      if (onTest) {
        await onTest(tipo)
      }
      addToast({
        type: 'success',
        title: 'Prueba enviada',
        message: `Se ha enviado una notificación de prueba por ${tipo.toUpperCase()}`
      })
    } catch {
      addToast({
        type: 'error',
        title: 'Error en prueba',
        message: `No se pudo enviar la notificación de prueba por ${tipo.toUpperCase()}`
      })
    }
  }

  const diasSemana = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Configuración del Sistema de Alertas</h2>
          <p className="text-gray-600">
            Configura el comportamiento global del sistema de alertas y notificaciones
          </p>
        </div>
      </div>

      {/* Configuración General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="sistemaActivo"
                checked={config.sistemaActivo}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  sistemaActivo: checked 
                }))}
              />
              <Label htmlFor="sistemaActivo">Sistema de Alertas Activo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="modoDebug"
                checked={config.modoDebug}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  modoDebug: checked 
                }))}
              />
              <Label htmlFor="modoDebug">Modo Debug</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Escalamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Sistema de Escalamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="escalamientoAutomatico"
              checked={config.escalamientoAutomatico}
              onCheckedChange={(checked) => setConfig(prev => ({ 
                ...prev, 
                escalamientoAutomatico: checked 
              }))}
            />
            <Label htmlFor="escalamientoAutomatico">Escalamiento Automático</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tiempoEscalamiento">Tiempo de Escalamiento (minutos)</Label>
              <Input
                id="tiempoEscalamiento"
                type="number"
                min="1"
                max="1440"
                value={config.tiempoEscalamientoMinutos}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  tiempoEscalamientoMinutos: parseInt(e.target.value) || 15 
                }))}
                placeholder="15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxNivelEscalamiento">Nivel Máximo de Escalamiento</Label>
              <Input
                id="maxNivelEscalamiento"
                type="number"
                min="1"
                max="5"
                value={config.maxNivelEscalamiento}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  maxNivelEscalamiento: parseInt(e.target.value) || 3 
                }))}
                placeholder="3"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Flujo de Escalamiento:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Nivel 1: Destinatarios principales</p>
              <p>• Nivel 2: Supervisores (después de {config.tiempoEscalamientoMinutos} min)</p>
              <p>• Nivel 3: Administradores (después de {config.tiempoEscalamientoMinutos * 2} min)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Canales de Notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="notifEmail"
                checked={config.notificacionEmail}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  notificacionEmail: checked 
                }))}
              />
              <Label htmlFor="notifEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notifSMS"
                checked={config.notificacionSMS}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  notificacionSMS: checked 
                }))}
              />
              <Label htmlFor="notifSMS" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notifWebSocket"
                checked={config.notificacionWebSocket}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  notificacionWebSocket: checked 
                }))}
              />
              <Label htmlFor="notifWebSocket" className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                WebSocket
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notifPush"
                checked={config.notificacionPush}
                onCheckedChange={(checked) => setConfig(prev => ({ 
                  ...prev, 
                  notificacionPush: checked 
                }))}
              />
              <Label htmlFor="notifPush" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Push
              </Label>
            </div>
          </div>

          {/* Botones de Prueba */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest('email')}
              disabled={!config.notificacionEmail || isLoading}
            >
              <Mail className="w-4 h-4 mr-2" />
              Probar Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest('sms')}
              disabled={!config.notificacionSMS || isLoading}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Probar SMS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTest('websocket')}
              disabled={!config.notificacionWebSocket || isLoading}
            >
              <Wifi className="w-4 h-4 mr-2" />
              Probar WebSocket
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Destinatarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Destinatarios por Nivel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destPrincipales">
                Destinatarios Principales (Nivel 1) - Emails separados por comas
              </Label>
              <Input
                id="destPrincipales"
                value={destinatariosPrincipalesText}
                onChange={(e) => {
                  setDestinatariosPrincipalesText(e.target.value)
                  handleDestinatariosChange('destinatariosPrincipales', e.target.value)
                }}
                placeholder="operador@empresa.com, tecnico@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destSupervisores">
                Supervisores (Nivel 2) - Emails separados por comas
              </Label>
              <Input
                id="destSupervisores"
                value={destinatariosSupervisoresText}
                onChange={(e) => {
                  setDestinatariosSupervisoresText(e.target.value)
                  handleDestinatariosChange('destinatariosSupervisores', e.target.value)
                }}
                placeholder="supervisor@empresa.com, coordinador@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destAdministradores">
                Administradores (Nivel 3) - Emails separados por comas
              </Label>
              <Input
                id="destAdministradores"
                value={destinatariosAdministradoresText}
                onChange={(e) => {
                  setDestinatariosAdministradoresText(e.target.value)
                  handleDestinatariosChange('destinatariosAdministradores', e.target.value)
                }}
                placeholder="admin@empresa.com, director@empresa.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Plantillas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Plantillas de Notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plantillaEmailAlerta">Plantilla Email - Alerta Normal</Label>
              <Textarea
                id="plantillaEmailAlerta"
                value={config.plantillaEmailAlerta}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  plantillaEmailAlerta: e.target.value 
                }))}
                placeholder="Plantilla para alertas normales"
                rows={2}
              />
              <p className="text-xs text-gray-500">
                Variables disponibles: {'{sensor}'}, {'{valor}'}, {'{unidad}'}, {'{timestamp}'}, {'{ubicacion}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plantillaEmailCritico">Plantilla Email - Alerta Crítica</Label>
              <Textarea
                id="plantillaEmailCritico"
                value={config.plantillaEmailCritico}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  plantillaEmailCritico: e.target.value 
                }))}
                placeholder="Plantilla para alertas críticas"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plantillaSMSAlerta">Plantilla SMS - Alerta Normal</Label>
              <Input
                id="plantillaSMSAlerta"
                value={config.plantillaSMSAlerta}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  plantillaSMSAlerta: e.target.value 
                }))}
                placeholder="Plantilla SMS para alertas normales"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plantillaSMSCritico">Plantilla SMS - Alerta Crítica</Label>
              <Input
                id="plantillaSMSCritico"
                value={config.plantillaSMSCritico}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  plantillaSMSCritico: e.target.value 
                }))}
                placeholder="Plantilla SMS para alertas críticas"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Retry y Blackout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Configuración de Reintentos y Horarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxIntentos">Máximo de Intentos de Notificación</Label>
              <Input
                id="maxIntentos"
                type="number"
                min="1"
                max="10"
                value={config.maxIntentosNotificacion}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  maxIntentosNotificacion: parseInt(e.target.value) || 3 
                }))}
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervaloRetry">Intervalo entre Reintentos (minutos)</Label>
              <Input
                id="intervaloRetry"
                type="number"
                min="1"
                max="60"
                value={config.intervaloRetryMinutos}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  intervaloRetryMinutos: parseInt(e.target.value) || 5 
                }))}
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blackoutInicio">Inicio Horario Blackout</Label>
              <Input
                id="blackoutInicio"
                type="time"
                value={config.horarioBlackoutInicio}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  horarioBlackoutInicio: e.target.value 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blackoutFin">Fin Horario Blackout</Label>
              <Input
                id="blackoutFin"
                type="time"
                value={config.horarioBlackoutFin}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  horarioBlackoutFin: e.target.value 
                }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Días de Blackout</Label>
            <div className="flex flex-wrap gap-2">
              {diasSemana.map((dia) => (
                <div key={dia.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={dia.value}
                    checked={config.diasBlackout.includes(dia.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig(prev => ({
                          ...prev,
                          diasBlackout: [...prev.diasBlackout, dia.value]
                        }))
                      } else {
                        setConfig(prev => ({
                          ...prev,
                          diasBlackout: prev.diasBlackout.filter(d => d !== dia.value)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor={dia.value} className="text-sm">{dia.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Agrupación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Agrupación de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="agruparAlertas"
              checked={config.agruparAlertasSimilares}
              onCheckedChange={(checked) => setConfig(prev => ({ 
                ...prev, 
                agruparAlertasSimilares: checked 
              }))}
            />
            <Label htmlFor="agruparAlertas">Agrupar Alertas Similares</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tiempoAgrupacion">Tiempo de Agrupación (minutos)</Label>
              <Input
                id="tiempoAgrupacion"
                type="number"
                min="1"
                max="60"
                value={config.tiempoAgrupacionMinutos}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  tiempoAgrupacionMinutos: parseInt(e.target.value) || 10 
                }))}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAlertasGrupo">Máximo de Alertas por Grupo</Label>
              <Input
                id="maxAlertasGrupo"
                type="number"
                min="1"
                max="20"
                value={config.maxAlertasPorGrupo}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  maxAlertasPorGrupo: parseInt(e.target.value) || 5 
                }))}
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>Estado:</strong> 
                <Badge className={`ml-2 ${config.sistemaActivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {config.sistemaActivo ? 'Activo' : 'Inactivo'}
                </Badge>
              </p>
              <p><strong>Escalamiento:</strong> {config.escalamientoAutomatico ? '✅' : '❌'}</p>
              <p><strong>Debug:</strong> {config.modoDebug ? '✅' : '❌'}</p>
            </div>
            <div>
              <p><strong>Email:</strong> {config.notificacionEmail ? '✅' : '❌'}</p>
              <p><strong>SMS:</strong> {config.notificacionSMS ? '✅' : '❌'}</p>
              <p><strong>WebSocket:</strong> {config.notificacionWebSocket ? '✅' : '❌'}</p>
            </div>
            <div>
              <p><strong>Blackout:</strong> {config.horarioBlackoutInicio} - {config.horarioBlackoutFin}</p>
              <p><strong>Agrupación:</strong> {config.agruparAlertasSimilares ? '✅' : '❌'}</p>
              <p><strong>Retry:</strong> {config.maxIntentosNotificacion} intentos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
