'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  Settings, 
  Shield, 
  Database, 
  Server, 
  Mail, 
  Bell,
  Lock,
  Globe,
  Users,
  Activity,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'react-toastify'

interface SystemConfig {
  security: {
    passwordMinLength: number
    passwordRequireUppercase: boolean
    passwordRequireLowercase: boolean
    passwordRequireNumbers: boolean
    passwordRequireSymbols: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    enableTwoFactor: boolean
    enableAuditLog: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
    enableEmailNotifications: boolean
  }
  system: {
    maintenanceMode: boolean
    maintenanceMessage: string
    maxFileSize: number
    allowedFileTypes: string[]
    backupFrequency: string
    backupRetention: number
    enableAutoBackup: boolean
  }
  notifications: {
    enableEmailAlerts: boolean
    enableSystemAlerts: boolean
    alertThreshold: number
    notifyOnUserCreation: boolean
    notifyOnUserDeletion: boolean
    notifyOnSystemErrors: boolean
  }
}

export default function SuperAdminConfigPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState<string[]>([])
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      setErrors([])

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/config`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al cargar configuración')
      }

      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al cargar la configuración del sistema'])
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    try {
      setIsSaving(true)
      setErrors([])
      setSuccess([])

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Error al guardar configuración')
      }

      setSuccess(['Configuración guardada exitosamente'])
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al guardar la configuración'])
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfigChange = (section: keyof SystemConfig, field: string, value: unknown) => {
    if (!config) return

    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }))
  }

  const handleConfigUpdate = async (configData: Record<string, unknown>) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar configuración')
      }
      
      toast.success('Configuración actualizada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const testEmailConfig = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/config/test-email`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setSuccess(['Email de prueba enviado exitosamente'])
      } else {
        setErrors(['Error al enviar email de prueba'])
      }
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al enviar email de prueba'])
    }
  }

  const backupNow = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/config/backup`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setSuccess(['Backup iniciado exitosamente'])
      } else {
        setErrors(['Error al iniciar backup'])
      }
    } catch (error) {
      console.error('Error:', error)
      setErrors(['Error al iniciar backup'])
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600">No se pudo cargar la configuración</p>
          <Button onClick={fetchConfig} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Administra la configuración global del sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchConfig} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          <Button onClick={saveConfig} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-800">{errors[0]}</span>
          </div>
        </div>
      )}

      {success.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-800">{success[0]}</span>
          </div>
        </div>
      )}

      {/* Configuración de Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Configuración de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitud mínima de contraseña
              </label>
              <Input
                type="number"
                min="6"
                max="20"
                value={config.security.passwordMinLength}
                onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de sesión (minutos)
              </label>
              <Input
                type="number"
                min="15"
                max="1440"
                value={config.security.sessionTimeout}
                onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo intentos de login
              </label>
              <Input
                type="number"
                min="3"
                max="10"
                value={config.security.maxLoginAttempts}
                onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Requisitos de contraseña</h4>
                <p className="text-sm text-gray-500">Configura los requisitos mínimos para las contraseñas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.security.passwordRequireUppercase}
                  onChange={(e) => handleConfigChange('security', 'passwordRequireUppercase', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Requerir mayúsculas</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.security.passwordRequireLowercase}
                  onChange={(e) => handleConfigChange('security', 'passwordRequireLowercase', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Requerir minúsculas</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.security.passwordRequireNumbers}
                  onChange={(e) => handleConfigChange('security', 'passwordRequireNumbers', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Requerir números</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.security.passwordRequireSymbols}
                  onChange={(e) => handleConfigChange('security', 'passwordRequireSymbols', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Requerir símbolos</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.security.enableTwoFactor}
                  onChange={(e) => handleConfigChange('security', 'enableTwoFactor', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Habilitar autenticación de dos factores</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.security.enableAuditLog}
                  onChange={(e) => handleConfigChange('security', 'enableAuditLog', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Habilitar logs de auditoría</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Configuración de Email
            </div>
            <Button onClick={testEmailConfig} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-1" />
              Probar Email
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servidor SMTP
              </label>
              <Input
                value={config.email.smtpHost}
                onChange={(e) => handleConfigChange('email', 'smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puerto SMTP
              </label>
              <Input
                type="number"
                value={config.email.smtpPort}
                onChange={(e) => handleConfigChange('email', 'smtpPort', parseInt(e.target.value))}
                placeholder="587"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario SMTP
              </label>
              <Input
                value={config.email.smtpUser}
                onChange={(e) => handleConfigChange('email', 'smtpUser', e.target.value)}
                placeholder="usuario@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña SMTP
              </label>
              <div className="relative">
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={config.email.smtpPassword}
                  onChange={(e) => handleConfigChange('email', 'smtpPassword', e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de origen
              </label>
              <Input
                type="email"
                value={config.email.fromEmail}
                onChange={(e) => handleConfigChange('email', 'fromEmail', e.target.value)}
                placeholder="noreply@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de origen
              </label>
              <Input
                value={config.email.fromName}
                onChange={(e) => handleConfigChange('email', 'fromName', e.target.value)}
                placeholder="Sistema IAM"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.email.enableEmailNotifications}
                onChange={(e) => handleConfigChange('email', 'enableEmailNotifications', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Habilitar notificaciones por email</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Configuración del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Configuración del Sistema
            </div>
            <Button onClick={backupNow} variant="outline" size="sm">
              <Database className="h-4 w-4 mr-1" />
              Backup Ahora
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño máximo de archivo (MB)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={config.system.maxFileSize}
                onChange={(e) => handleConfigChange('system', 'maxFileSize', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia de backup
              </label>
              <select
                value={config.system.backupFrequency}
                onChange={(e) => handleConfigChange('system', 'backupFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retención de backups (días)
              </label>
              <Input
                type="number"
                min="1"
                max="365"
                value={config.system.backupRetention}
                onChange={(e) => handleConfigChange('system', 'backupRetention', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de archivo permitidos
            </label>
            <Input
              value={config.system.allowedFileTypes.join(', ')}
              onChange={(e) => handleConfigChange('system', 'allowedFileTypes', e.target.value.split(',').map(t => t.trim()))}
              placeholder="jpg, png, pdf, doc, xlsx"
            />
            <p className="text-xs text-gray-500 mt-1">Separar con comas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje de mantenimiento
            </label>
            <textarea
              value={config.system.maintenanceMessage}
              onChange={(e) => handleConfigChange('system', 'maintenanceMessage', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="El sistema estará en mantenimiento..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.system.maintenanceMode}
                onChange={(e) => handleConfigChange('system', 'maintenanceMode', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Modo mantenimiento</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.system.enableAutoBackup}
                onChange={(e) => handleConfigChange('system', 'enableAutoBackup', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Backup automático</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Configuración de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umbral de alertas
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={config.notifications.alertThreshold}
                onChange={(e) => handleConfigChange('notifications', 'alertThreshold', parseInt(e.target.value))}
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">Número de errores antes de alertar</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.notifications.enableEmailAlerts}
                  onChange={(e) => handleConfigChange('notifications', 'enableEmailAlerts', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Alertas por email</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.notifications.enableSystemAlerts}
                  onChange={(e) => handleConfigChange('notifications', 'enableSystemAlerts', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Alertas del sistema</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.notifications.notifyOnUserCreation}
                  onChange={(e) => handleConfigChange('notifications', 'notifyOnUserCreation', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Notificar creación de usuarios</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.notifications.notifyOnUserDeletion}
                  onChange={(e) => handleConfigChange('notifications', 'notifyOnUserDeletion', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Notificar eliminación de usuarios</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.notifications.notifyOnSystemErrors}
                  onChange={(e) => handleConfigChange('notifications', 'notifyOnSystemErrors', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Notificar errores del sistema</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 