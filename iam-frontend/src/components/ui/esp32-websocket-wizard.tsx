'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/Badge'
import { 
  Wifi,
  Cpu,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Globe,
  Copy,
  Download,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

export type SensorTipoWizard = 'TEMPERATURA' | 'HUMEDAD' | 'PESO' | 'PRESION' | 'CUSTOM'

interface SensorConfigWizard {
  id: string
  name: string
  type: SensorTipoWizard
  unit: string
  minValue: number
  maxValue: number
  enabled: boolean
}

interface WizardState {
  wifiSSID: string
  wifiPassword: string
  deviceId: string
  empresaId: number
  deviceType: string
  backendUrlHost: string // host sin protocolo
  readingInterval: number
  pingInterval: number
  enableSSL: boolean
  enableAutoReconnect: boolean
  enableDebug: boolean
}

export interface ESP32WebSocketWizardProps {
  initialEmpresaId?: number
  backendUrlHost?: string
  onClose?: () => void
}

export default function ESP32WebSocketWizard({ initialEmpresaId = 1, backendUrlHost = 'iam-backend-baruk.fly.dev', onClose }: ESP32WebSocketWizardProps) {
  const [step, setStep] = useState<number>(0)
  const [state, setState] = useState<WizardState>({
    wifiSSID: '',
    wifiPassword: '',
    deviceId: `ESP32_${Date.now()}`,
    empresaId: initialEmpresaId,
    deviceType: 'ESP32',
    backendUrlHost,
    readingInterval: 30,
    pingInterval: 30,
    enableSSL: true,
    enableAutoReconnect: true,
    enableDebug: true,
  })

  const [sensors, setSensors] = useState<SensorConfigWizard[]>([
    { id: '1', name: 'Sensor Temperatura', type: 'TEMPERATURA', unit: '°C', minValue: -20, maxValue: 50, enabled: true },
    { id: '2', name: 'Sensor Humedad', type: 'HUMEDAD', unit: '%', minValue: 0, maxValue: 100, enabled: true },
  ])

  const websocketServer = useMemo(() => state.backendUrlHost, [state.backendUrlHost])
  const websocketPort = useMemo(() => (state.enableSSL ? 443 : 80), [state.enableSSL])

  const addSensor = () => {
    const id = String(Date.now())
    setSensors(prev => [...prev, { id, name: `Sensor ${prev.length + 1}`, type: 'TEMPERATURA', unit: '°C', minValue: 0, maxValue: 100, enabled: true }])
  }
  const removeSensor = (id: string) => setSensors(prev => prev.filter(s => s.id !== id))
  const updateSensor = (id: string, updates: Partial<SensorConfigWizard>) => setSensors(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)))

  const generateArduinoCode = useCallback((): string => {
    const codeSensorsDecl = sensors
      .filter(s => s.enabled)
      .map(s => `// ${s.name}\nfloat ${s.name.toLowerCase().replace(/\s+/g, '_')} = 0.0;`)
      .join('\n')

    const codeSensorsLoop = sensors
      .filter(s => s.enabled)
      .map(s => `\n  // Enviar ${s.name}\n  ${s.name.toLowerCase().replace(/\s+/g, '_')} = simularLectura(${s.minValue}, ${s.maxValue});\n  StaticJsonDocument<200> doc${s.id};\n  doc${s.id}["tipo"] = "${s.type}";\n  doc${s.id}["valor"] = ${s.name.toLowerCase().replace(/\s+/g, '_')};\n  doc${s.id}["unidad"] = "${s.unit}";\n  doc${s.id}["timestamp"] = millis();\n  String jsonString${s.id};\n  serializeJson(doc${s.id}, jsonString${s.id});\n  webSocket.sendTXT(jsonString${s.id});\n  ${state.enableDebug ? `Serial.printf("${s.name} enviado\\n");` : ''}\n  delay(100);`)
      .join('\n')

    const code = `#include <WiFi.h>\n#include <WebSocketsClient.h>\n#include <ArduinoJson.h>\n\nconst char* ssid = "${state.wifiSSID}";\nconst char* password = "${state.wifiPassword}";\nconst char* websocketServer = "${websocketServer}";\nconst int websocketPort = ${websocketPort};\nconst char* websocketPath = "/iot";\nconst char* deviceId = "${state.deviceId}";\nconst int empresaId = ${state.empresaId};\nconst char* deviceType = "${state.deviceType}";\nconst unsigned long readingInterval = ${state.readingInterval * 1000};\nconst unsigned long pingInterval = ${state.pingInterval * 1000};\nWebSocketsClient webSocket;\n\n${codeSensorsDecl}\n\nunsigned long lastReading = 0;\nunsigned long lastPing = 0;\nbool isConnected = false;\n\nvoid setup(){\n  Serial.begin(115200);\n  ${state.enableDebug ? `Serial.println("=== CONFIGURACION ESP32 ===");` : ''}\n  conectarWiFi();\n  configurarWebSocket();\n}\n\nvoid loop(){\n  webSocket.loop();\n  if(millis() - lastReading > readingInterval){\n    enviarLecturas();\n    lastReading = millis();\n  }\n  if(millis() - lastPing > pingInterval){\n    if(isConnected){ webSocket.sendTXT("ping"); ${state.enableDebug ? 'Serial.println("Ping enviado");' : ''} }\n    lastPing = millis();\n  }\n}\n\nvoid conectarWiFi(){\n  WiFi.begin(ssid, password);\n  while(WiFi.status()!= WL_CONNECTED){ delay(500); Serial.print("."); }\n  Serial.println("\nWiFi conectado");\n}\n\nvoid configurarWebSocket(){\n  ${state.enableSSL ? 'webSocket.beginSSL(websocketServer, websocketPort, websocketPath);' : 'webSocket.begin(websocketServer, websocketPort, websocketPath);'}\n  webSocket.onEvent(webSocketEvent);\n  webSocket.setReconnectInterval(5000);\n  String headers = "x-device-id: "+ String(deviceId) + "\\r\\n";\n  headers += "x-empresa-id: "+ String(empresaId) + "\\r\\n";\n  headers += "x-device-type: "+ String(deviceType);\n  webSocket.setExtraHeaders(headers.c_str());\n}\n\nvoid webSocketEvent(WStype_t type, uint8_t * payload, size_t length){\n  switch(type){\n    case WStype_DISCONNECTED: isConnected=false; break;\n    case WStype_CONNECTED: isConnected=true; webSocket.sendTXT("ping"); break;\n    case WStype_TEXT: break;\n    case WStype_ERROR: isConnected=false; break;\n    default: break;\n  }\n}\n\nvoid enviarLecturas(){\n  if(!isConnected) return;\n  ${codeSensorsLoop}\n}\n\nfloat simularLectura(float minV, float maxV){ return random(minV*100, maxV*100)/100.0; }\n`;
    return code
  }, [sensors, state, websocketPort, websocketServer])

  const code = useMemo(() => generateArduinoCode(), [generateArduinoCode])

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    toast.success('Código copiado')
  }
  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.deviceId}.ino`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Código descargado')
  }

  const canNext = (): boolean => {
    if (step === 0) return state.wifiSSID.length > 0 && state.wifiPassword.length > 0
    if (step === 1) return state.deviceId.length > 0
    if (step === 2) return sensors.some(s => s.enabled)
    return true
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Configuración ESP32 por WebSocket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paso indicador */}
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center gap-2 ${step>=0?'text-blue-700':'text-gray-400'}`}><Wifi className="h-4 w-4"/> WiFi</div>
            <div className={`flex items-center gap-2 ${step>=1?'text-blue-700':'text-gray-400'}`}><Settings className="h-4 w-4"/> Dispositivo</div>
            <div className={`flex items-center gap-2 ${step>=2?'text-blue-700':'text-gray-400'}`}><Zap className="h-4 w-4"/> Sensores</div>
            <div className={`flex items-center gap-2 ${step>=3?'text-blue-700':'text-gray-400'}`}><CheckCircle className="h-4 w-4"/> Código</div>
          </div>

          {/* Contenido por paso */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wifiSSID">SSID WiFi</Label>
                <Input id="wifiSSID" value={state.wifiSSID} onChange={(e)=>setState({...state, wifiSSID: e.target.value})} placeholder="Nombre de tu red" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifiPassword">Contraseña WiFi</Label>
                <Input id="wifiPassword" type="password" value={state.wifiPassword} onChange={(e)=>setState({...state, wifiPassword: e.target.value})} placeholder="••••••••" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">ID del Dispositivo</Label>
                <Input id="deviceId" value={state.deviceId} onChange={(e)=>setState({...state, deviceId: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceType">Tipo de Dispositivo</Label>
                <Input id="deviceType" value={state.deviceType} onChange={(e)=>setState({...state, deviceType: e.target.value})} />
              </div>
              {/* Campos ocultos gestionados por el sistema */}
              <input type="hidden" value={state.empresaId} readOnly />
              <input type="hidden" value={state.backendUrlHost} readOnly />
              <div className="space-y-2">
                <Label htmlFor="readingInterval">Intervalo de Lecturas (seg)</Label>
                <Input id="readingInterval" type="number" value={state.readingInterval} onChange={(e)=>setState({...state, readingInterval: parseInt(e.target.value)||30})}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pingInterval">Intervalo de Ping (seg)</Label>
                <Input id="pingInterval" type="number" value={state.pingInterval} onChange={(e)=>setState({...state, pingInterval: parseInt(e.target.value)||30})}/>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ssl" checked={state.enableSSL} onCheckedChange={(v)=>setState({...state, enableSSL: v})} />
                <Label htmlFor="ssl">Habilitar SSL (wss)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="reconnect" checked={state.enableAutoReconnect} onCheckedChange={(v)=>setState({...state, enableAutoReconnect: v})} />
                <Label htmlFor="reconnect">Reconexión Automática</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="debug" checked={state.enableDebug} onCheckedChange={(v)=>setState({...state, enableDebug: v})} />
                <Label htmlFor="debug">Modo Debug</Label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Sensores</h4>
                <Button size="sm" onClick={addSensor}>Agregar Sensor</Button>
              </div>
              {sensors.map((s) => (
                <Card key={s.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Switch checked={s.enabled} onCheckedChange={(v)=>updateSensor(s.id, { enabled: v })} />
                        <Input value={s.name} onChange={(e)=>updateSensor(s.id, { name: e.target.value })} />
                      </div>
                      <select value={s.type} onChange={(e)=>updateSensor(s.id, { type: e.target.value as SensorTipoWizard })} className="px-3 py-2 border rounded-md">
                        <option value="TEMPERATURA">Temperatura</option>
                        <option value="HUMEDAD">Humedad</option>
                        <option value="PESO">Peso</option>
                        <option value="PRESION">Presión</option>
                        <option value="CUSTOM">Personalizado</option>
                      </select>
                      <Input value={s.unit} onChange={(e)=>updateSensor(s.id, { unit: e.target.value })} />
                      <Input type="number" value={s.minValue} onChange={(e)=>updateSensor(s.id, { minValue: parseFloat(e.target.value)||0 })} />
                      <Input type="number" value={s.maxValue} onChange={(e)=>updateSensor(s.id, { maxValue: parseFloat(e.target.value)||100 })} />
                      <Button variant="destructive" size="sm" onClick={()=>removeSensor(s.id)}>Eliminar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Código Arduino Generado</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyCode}><Copy className="h-4 w-4 mr-2"/>Copiar</Button>
                  <Button variant="outline" size="sm" onClick={downloadCode}><Download className="h-4 w-4 mr-2"/>Descargar</Button>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800"><CheckCircle className="h-5 w-5"/><span className="font-medium">Configuración Completa</span></div>
                <p className="text-green-700 text-sm mt-1">El código Arduino se ha generado automáticamente.</p>
              </div>
              <Textarea value={code} readOnly className="font-mono text-sm h-96" />
              <Badge className="self-end">{code.split('\n').length} líneas</Badge>
            </div>
          )}

          {/* Navegación */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={()=> (step>0 ? setStep(step-1) : onClose?.())}>
              <ChevronLeft className="h-4 w-4 mr-2"/>{step>0? 'Atrás' : 'Cerrar'}
            </Button>
            {step < 3 ? (
              <Button onClick={()=> setStep(step+1)} disabled={!canNext()}>
                Siguiente <ChevronRight className="h-4 w-4 ml-2"/>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyCode}><Copy className="h-4 w-4 mr-2"/>Copiar</Button>
                <Button onClick={downloadCode}><Download className="h-4 w-4 mr-2"/>Descargar</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
