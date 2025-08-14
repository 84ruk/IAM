'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Download, 
  Settings, 
  Code, 
  Wifi, 
  CheckCircle, 
  AlertTriangle,
  Info,
  BookOpen,
  ExternalLink
} from 'lucide-react';

export default function ESP32InstallationGuide() {
  const libraries = [
    {
      name: 'WiFi',
      description: 'Librería nativa de ESP32 para conexión WiFi',
      status: 'Incluida',
      version: '1.0',
      url: null
    },
    {
      name: 'WebSocketsClient',
      description: 'Cliente WebSocket para ESP32',
      status: 'Instalar',
      version: '2.4.1',
      url: 'https://github.com/Links2004/arduinoWebSockets'
    },
    {
      name: 'ArduinoJson',
      description: 'Librería para manejo de JSON',
      status: 'Instalar',
      version: '6.21.3',
      url: 'https://github.com/bblanchon/ArduinoJson'
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Instalar Arduino IDE',
      description: 'Descarga e instala Arduino IDE desde arduino.cc',
      details: [
        'Ve a arduino.cc/en/software',
        'Descarga la versión para tu sistema operativo',
        'Instala siguiendo las instrucciones del instalador'
      ],
      icon: <Download className="h-5 w-5" />
    },
    {
      step: 2,
      title: 'Configurar ESP32',
      description: 'Agregar soporte para ESP32 en Arduino IDE',
      details: [
        'Abre Arduino IDE',
        'Ve a Archivo > Preferencias',
        'En "URLs adicionales de Gestor de Tarjetas" agrega: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json',
        'Ve a Herramientas > Placa > Gestor de Tarjetas',
        'Busca "esp32" e instala "ESP32 by Espressif Systems"'
      ],
      icon: <Settings className="h-5 w-5" />
    },
    {
      step: 3,
      title: 'Instalar Librerías',
      description: 'Instalar las librerías requeridas para WebSocket',
      details: [
        'Ve a Herramientas > Administrar Librerías',
        'Busca e instala "WebSocketsClient"',
        'Busca e instala "ArduinoJson"',
        'Verifica que WiFi esté disponible (incluida por defecto)'
      ],
      icon: <Code className="h-5 w-5" />
    },
    {
      step: 4,
      title: 'Seleccionar Placa',
      description: 'Configurar la placa ESP32 correcta',
      details: [
        'Ve a Herramientas > Placa > ESP32 Arduino',
        'Selecciona tu modelo específico (ej: "ESP32 Dev Module")',
        'Configura el puerto COM correcto',
        'Configura la velocidad de upload a 115200'
      ],
      icon: <Wifi className="h-5 w-5" />
    },
    {
      step: 5,
      title: 'Subir Código',
      description: 'Subir el código generado a tu ESP32',
      details: [
        'Copia el código desde la pestaña "Código Arduino"',
        'Pega en un nuevo sketch de Arduino IDE',
        'Verifica que no haya errores de compilación',
        'Conecta tu ESP32 por USB',
        'Haz clic en "Subir" (botón de flecha)'
      ],
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guía de Instalación ESP32
          </CardTitle>
          <p className="text-muted-foreground">
            Sigue estos pasos para configurar tu ESP32 con WebSocket
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Librerías Requeridas */}
          <div>
            <h3 className="text-lg font-medium mb-3">Librerías Requeridas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {libraries.map((lib) => (
                <Card key={lib.name} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{lib.name}</h4>
                      <p className="text-sm text-gray-600">{lib.description}</p>
                      <p className="text-xs text-gray-500 mt-1">v{lib.version}</p>
                    </div>
                    <Badge variant={lib.status === 'Incluida' ? 'default' : 'secondary'}>
                      {lib.status}
                    </Badge>
                  </div>
                  {lib.url && (
                    <a
                      href={lib.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver en GitHub
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Pasos de Instalación */}
          <div>
            <h3 className="text-lg font-medium mb-3">Pasos de Instalación</h3>
            <div className="space-y-4">
              {steps.map((step) => (
                <Card key={step.step} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {step.icon}
                        <h4 className="font-medium">{step.title}</h4>
                      </div>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      <ul className="space-y-1">
                        {step.details.map((detail, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Consejos y Solución de Problemas */}
          <div>
            <h3 className="text-lg font-medium mb-3">Consejos y Solución de Problemas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Consejos Útiles</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Mantén presionado el botón BOOT al subir código</li>
                      <li>• Usa un cable USB de buena calidad</li>
                      <li>• Verifica que el driver USB esté instalado</li>
                      <li>• El primer upload puede tardar más tiempo</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-orange-200 bg-orange-50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800">Problemas Comunes</h4>
                    <ul className="text-sm text-orange-700 mt-2 space-y-1">
                      <li>• Error de compilación: Verifica librerías</li>
                      <li>• No se detecta la placa: Revisa el cable USB</li>
                      <li>• Error de upload: Mantén presionado BOOT</li>
                      <li>• WiFi no conecta: Verifica credenciales</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Enlaces Útiles */}
          <div>
            <h3 className="text-lg font-medium mb-3">Enlaces Útiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://docs.espressif.com/projects/arduino-esp32/en/latest/getting_started.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="font-medium">Documentación Oficial ESP32</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Guía completa de instalación y configuración
                </p>
              </a>

              <a
                href="https://github.com/Links2004/arduinoWebSockets"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span className="font-medium">WebSocketsClient</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Librería WebSocket para Arduino/ESP32
                </p>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
