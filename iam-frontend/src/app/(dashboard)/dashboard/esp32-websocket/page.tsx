import ESP32WebSocketConfig from '@/components/ui/esp32-websocket-config';
import ESP32InstallationGuide from '@/components/ui/esp32-installation-guide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Cpu, BookOpen, Settings } from 'lucide-react';

export default function ESP32WebSocketPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESP32 WebSocket</h1>
          <p className="text-muted-foreground">
            Configura tu ESP32 para conectarse por WebSocket y envía datos en tiempo real
          </p>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guía de Instalación
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Información
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <ESP32WebSocketConfig />
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <ESP32InstallationGuide />
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ventajas de WebSocket */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">
                🚀 Ventajas de WebSocket vs HTTP
              </h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <strong>Conexión Persistente:</strong> Una vez conectado, no hay overhead de reconexión
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <strong>Latencia Ultra Baja:</strong> 10-50ms vs 100-500ms de HTTP
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <strong>Sin Rate Limiting:</strong> No más errores 429
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <strong>Comunicación Bidireccional:</strong> El servidor puede enviar comandos al ESP32
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <strong>Eficiencia Energética:</strong> Menos overhead de red
                </li>
              </ul>
            </div>

            {/* Características del Sistema */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg border border-green-200">
              <h3 className="text-xl font-semibold text-green-800 mb-4">
                🔧 Características del Sistema
              </h3>
              <ul className="space-y-2 text-green-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <strong>Detección Automática:</strong> El backend reconoce automáticamente dispositivos ESP32
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <strong>Validación de Empresa:</strong> Cada dispositivo se asocia a una empresa específica
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <strong>Logging Detallado:</strong> Monitoreo completo de conexiones y datos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <strong>Reconexión Automática:</strong> Manejo robusto de desconexiones
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <strong>SSL por Defecto:</strong> Conexiones seguras y encriptadas
                </li>
              </ul>
            </div>

            {/* Casos de Uso */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-lg border border-purple-200">
              <h3 className="text-xl font-semibold text-purple-800 mb-4">
                📊 Casos de Uso Ideales
              </h3>
              <ul className="space-y-2 text-purple-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <strong>Monitoreo en Tiempo Real:</strong> Sensores de temperatura, humedad, peso
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <strong>Control Remoto:</strong> Envío de comandos desde el dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <strong>Alertas Instantáneas:</strong> Notificaciones inmediatas de eventos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <strong>IoT Industrial:</strong> Monitoreo de equipos y maquinaria
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <strong>Smart Home:</strong> Automatización de dispositivos domésticos
                </li>
              </ul>
            </div>

            {/* Requisitos Técnicos */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-6 rounded-lg border border-orange-200">
              <h3 className="text-xl font-semibold text-orange-800 mb-4">
                ⚡ Requisitos Técnicos
              </h3>
              <ul className="space-y-2 text-orange-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <strong>Hardware:</strong> ESP32 (cualquier modelo)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <strong>WiFi:</strong> Conexión estable a internet
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <strong>Software:</strong> Arduino IDE 1.8+ o 2.0+
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <strong>Librerías:</strong> WebSocketsClient, ArduinoJson
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <strong>Backend:</strong> Tu servidor IAM funcionando
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
