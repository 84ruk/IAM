'use client'

import { useState } from 'react'
import { AlertasActivasGestion } from '@/components/ui/alertas-activas-gestion'
import { Card, CardContent } from '@/components/ui/Card'
import { Bell, AlertTriangle, TrendingUp } from 'lucide-react'

export default function AlertasActivasPage() {
  const [alertas] = useState([])
  const [isLoading] = useState(false)

  const handleResolver = async (alertaId: string) => {
    // Implementar lógica para resolver alerta
    console.log('Resolviendo alerta:', alertaId)
  }

  const handleEscalar = async (alertaId: string) => {
    // Implementar lógica para escalar alerta
    console.log('Escalando alerta:', alertaId)
  }

  const handleReenviarNotificacion = async (alertaId: string, tipo: 'email' | 'sms' | 'websocket') => {
    // Implementar lógica para reenviar notificación
    console.log('Reenviando notificación:', alertaId, tipo)
  }

  const handleActualizar = async () => {
    // Implementar lógica para actualizar alertas
    console.log('Actualizando alertas')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alertas Activas</h1>
          <p className="text-gray-600">Gestiona y resuelve las alertas activas del sistema</p>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Sistema de Alertas</p>
                <p className="text-lg font-semibold">Monitoreo en Tiempo Real</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Escalamiento</p>
                <p className="text-lg font-semibold">Automático</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Notificaciones</p>
                <p className="text-lg font-semibold">Multi-canal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Componente principal de gestión de alertas activas */}
      <AlertasActivasGestion 
        alertas={alertas}
        onResolver={handleResolver}
        onEscalar={handleEscalar}
        onReenviarNotificacion={handleReenviarNotificacion}
        onActualizar={handleActualizar}
        isLoading={isLoading}
      />
    </div>
  )
}
