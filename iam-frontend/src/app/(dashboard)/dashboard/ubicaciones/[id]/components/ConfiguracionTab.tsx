'use client'

import { Ubicacion } from '@/types/sensor'
import { Card, CardContent } from '@/components/ui/Card'
import { Settings, Bell, Shield, Zap } from 'lucide-react'

interface ConfiguracionTabProps {
  ubicacion: Ubicacion
}

export function ConfiguracionTab({ ubicacion }: ConfiguracionTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Configuración</h2>
        <p className="text-gray-600 mt-1">
          Configura alertas y parámetros para {ubicacion.nombre}
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Funcionalidad en Desarrollo
          </h3>
          <p className="text-gray-600 mb-4">
            La configuración de alertas estará disponible próximamente
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Bell className="w-4 h-4" />
              Alertas
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              Seguridad
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Zap className="w-4 h-4" />
              Automatización
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 