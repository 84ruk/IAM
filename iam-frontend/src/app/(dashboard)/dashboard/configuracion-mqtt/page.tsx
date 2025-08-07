'use client'

import { MqttConfigForm } from '@/components/ui/mqtt-config-form'
import { MqttDashboard } from '@/components/ui/mqtt-dashboard'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Settings, BarChart3 } from 'lucide-react'

export default function ConfiguracionMqttPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'dashboard'>('config')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración MQTT</h1>
          <p className="text-gray-600">
            Configura y monitorea la conexión MQTT para tus sensores
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'config' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('config')}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Button>
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'config' ? (
        <MqttConfigForm />
      ) : (
        <MqttDashboard />
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre MQTT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">¿Qué es MQTT?</h4>
              <p className="text-sm text-gray-600 mb-4">
                MQTT (Message Queuing Telemetry Transport) es un protocolo de mensajería ligero 
                diseñado para dispositivos IoT. Permite que tus sensores envíen datos de forma 
                eficiente y confiable al sistema.
              </p>
              
              <h4 className="font-semibold mb-2">Ventajas de MQTT</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bajo consumo de ancho de banda</li>
                <li>• Conexión confiable y segura</li>
                <li>• Soporte para múltiples dispositivos</li>
                <li>• Ideal para sensores con recursos limitados</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Configuración Recomendada</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Broker EMQX:</p>
                <p className="text-xs text-gray-600 mb-1">Host: h02f10fd.ala.us-east-1.emqxsl.com</p>
                <p className="text-xs text-gray-600 mb-1">Puerto: 8883 (TLS)</p>
                <p className="text-xs text-gray-600 mb-1">Protocolo: MQTT over TLS</p>
              </div>
              
              <h4 className="font-semibold mb-2 mt-4">Tópicos Soportados</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <p>• <code>empresa/{'{empresaId}'}/sensor/{'{sensorId}'}/data</code></p>
                <p>• <code>sensor/{'{sensorId}'}/reading</code></p>
                <p>• <code>iot/{'{deviceId}'}/sensor/{'{sensorId}'}/data</code></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 