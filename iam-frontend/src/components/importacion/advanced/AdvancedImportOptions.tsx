'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { 
  Settings,
  Save,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Database,
  Shield,
  Zap,
  Target,
  Palette,
  Clock,
  AlertCircle
} from 'lucide-react'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'

interface AdvancedImportOptionsProps {
  tipo: TipoImportacion
  opciones: any
  onOpcionesChange: (opciones: any) => void
  onSaveTemplate?: (nombre: string, opciones: any) => Promise<void>
  onLoadTemplate?: (nombre: string) => Promise<any>
  className?: string
}

interface Template {
  id: string
  nombre: string
  tipo: TipoImportacion
  opciones: any
  fechaCreacion: string
}

export default function AdvancedImportOptions({
  tipo,
  opciones,
  onOpcionesChange,
  onSaveTemplate,
  onLoadTemplate,
  className = ''
}: AdvancedImportOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'validacion' | 'creacion' | 'notificaciones' | 'templates'>('general')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  // Configuraciones por tipo
  const configuracionesPorTipo = {
    productos: {
      title: 'Configuración de Productos',
      icon: '📦',
      description: 'Opciones específicas para importación de productos',
      campos: {
        general: [
          { key: 'sobrescribirExistentes', label: 'Sobrescribir productos existentes', type: 'checkbox' },
          { key: 'validarSolo', label: 'Solo validar sin importar', type: 'checkbox' },
          { key: 'generarSKUAutomatico', label: 'Generar SKU automático', type: 'checkbox' },
          { key: 'prefijoSKU', label: 'Prefijo para SKU', type: 'text', placeholder: 'PROD' }
        ],
        validacion: [
          { key: 'validarPrecios', label: 'Validar precios', type: 'checkbox' },
          { key: 'validarStock', label: 'Validar stock', type: 'checkbox' },
          { key: 'permitirStockNegativo', label: 'Permitir stock negativo', type: 'checkbox' }
        ],
        creacion: [
          { key: 'crearProveedorSiNoExiste', label: 'Crear proveedor si no existe', type: 'checkbox' },
          { key: 'crearCategoriaSiNoExiste', label: 'Crear categoría si no existe', type: 'checkbox' },
          { key: 'descripcionPorDefecto', label: 'Descripción por defecto', type: 'text', placeholder: 'Sin descripción' },
          { key: 'stockMinimoPorDefecto', label: 'Stock mínimo por defecto', type: 'number', placeholder: '0' }
        ]
      }
    },
    proveedores: {
      title: 'Configuración de Proveedores',
      icon: '🏢',
      description: 'Opciones específicas para importación de proveedores',
      campos: {
        general: [
          { key: 'sobrescribirExistentes', label: 'Sobrescribir proveedores existentes', type: 'checkbox' },
          { key: 'validarSolo', label: 'Solo validar sin importar', type: 'checkbox' }
        ],
        validacion: [
          { key: 'validarEmail', label: 'Validar formato de email', type: 'checkbox' },
          { key: 'validarTelefono', label: 'Validar formato de teléfono', type: 'checkbox' },
          { key: 'permitirEmailVacio', label: 'Permitir email vacío', type: 'checkbox' }
        ],
        creacion: [
          { key: 'crearProductosSiNoExisten', label: 'Crear productos si no existen', type: 'checkbox' },
          { key: 'emailPorDefecto', label: 'Email por defecto', type: 'text', placeholder: 'sin-email@proveedor.com' },
          { key: 'telefonoPorDefecto', label: 'Teléfono por defecto', type: 'text', placeholder: 'Sin teléfono' }
        ]
      }
    },
    movimientos: {
      title: 'Configuración de Movimientos',
      icon: '📊',
      description: 'Opciones específicas para importación de movimientos',
      campos: {
        general: [
          { key: 'sobrescribirExistentes', label: 'Sobrescribir movimientos existentes', type: 'checkbox' },
          { key: 'validarSolo', label: 'Solo validar sin importar', type: 'checkbox' },
          { key: 'actualizarStockEnTiempoReal', label: 'Actualizar stock en tiempo real', type: 'checkbox' }
        ],
        validacion: [
          { key: 'validarStock', label: 'Validar stock disponible', type: 'checkbox' },
          { key: 'permitirStockNegativo', label: 'Permitir stock negativo', type: 'checkbox' },
          { key: 'validarFechas', label: 'Validar fechas', type: 'checkbox' },
          { key: 'fechaMinima', label: 'Fecha mínima', type: 'date' },
          { key: 'fechaMaxima', label: 'Fecha máxima', type: 'date' }
        ],
        creacion: [
          { key: 'crearProductoSiNoExiste', label: 'Crear producto si no existe', type: 'checkbox' },
          { key: 'crearProveedorSiNoExiste', label: 'Crear proveedor si no existe', type: 'checkbox' },
          { key: 'generarSKUAutomatico', label: 'Generar SKU automático', type: 'checkbox' },
          { key: 'prefijoSKU', label: 'Prefijo para SKU', type: 'text', placeholder: 'PROD' },
          { key: 'usarPreciosDelMovimiento', label: 'Usar precios del movimiento', type: 'checkbox' },
          { key: 'motivoPorDefecto', label: 'Motivo por defecto', type: 'text', placeholder: 'Importación automática' },
          { key: 'descripcionPorDefecto', label: 'Descripción por defecto', type: 'text', placeholder: 'Producto creado automáticamente' }
        ]
      }
    }
  }

  const config = configuracionesPorTipo[tipo as keyof typeof configuracionesPorTipo] || configuracionesPorTipo.productos

  // Manejar cambio de opción
  const handleOpcionChange = useCallback((key: string, value: any) => {
    onOpcionesChange({
      ...opciones,
      [key]: value
    })
  }, [opciones, onOpcionesChange])

  // Guardar template
  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim() || !onSaveTemplate) return

    setIsSavingTemplate(true)
    try {
      await onSaveTemplate(templateName.trim(), opciones)
      setTemplateName('')
      setShowTemplates(false)
    } catch (error) {
      console.error('Error al guardar template:', error)
    } finally {
      setIsSavingTemplate(false)
    }
  }, [templateName, opciones, onSaveTemplate])

  // Renderizar campo
  const renderField = (campo: any) => {
    const value = opciones[campo.key] || false

    switch (campo.type) {
      case 'checkbox':
        return (
          <div key={campo.key} className="flex items-center space-x-3">
            <Checkbox
              id={campo.key}
              checked={value}
              onCheckedChange={(checked) => handleOpcionChange(campo.key, checked)}
            />
            <Label htmlFor={campo.key} className="text-sm font-medium">
              {campo.label}
            </Label>
          </div>
        )
      
      case 'text':
      case 'number':
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key} className="text-sm font-medium">
              {campo.label}
            </Label>
            <Input
              id={campo.key}
              type={campo.type}
              value={value || ''}
              onChange={(e) => handleOpcionChange(campo.key, e.target.value)}
              placeholder={campo.placeholder}
              className="w-full"
            />
          </div>
        )
      
      case 'date':
        return (
          <div key={campo.key} className="space-y-2">
            <Label htmlFor={campo.key} className="text-sm font-medium">
              {campo.label}
            </Label>
            <Input
              id={campo.key}
              type="date"
              value={value || ''}
              onChange={(e) => handleOpcionChange(campo.key, e.target.value)}
              className="w-full"
            />
          </div>
        )
      
      default:
        return null
    }
  }

  // Obtener icono del tab
  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'general':
        return <Settings className="h-4 w-4" />
      case 'validacion':
        return <Shield className="h-4 w-4" />
      case 'creacion':
        return <Database className="h-4 w-4" />
      case 'notificaciones':
        return <AlertCircle className="h-4 w-4" />
      case 'templates':
        return <FileText className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{config.icon}</div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Tabs de navegación */}
          <div className="flex space-x-1 border-b">
            {Object.entries(config.campos).map(([tabKey, campos]) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey as any)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tabKey
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {getTabIcon(tabKey)}
                <span className="capitalize">{tabKey}</span>
              </button>
            ))}
            
            {/* Tab de notificaciones */}
            <button
              onClick={() => setActiveTab('notificaciones')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'notificaciones'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <span>Notificaciones</span>
            </button>

            {/* Tab de templates */}
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'templates'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Templates</span>
            </button>
          </div>

          {/* Contenido de los tabs */}
          <div className="min-h-[300px]">
            {/* Tab General */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.campos.general.map(renderField)}
                </div>
              </div>
            )}

            {/* Tab Validación */}
            {activeTab === 'validacion' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.campos.validacion.map(renderField)}
                </div>
              </div>
            )}

            {/* Tab Creación */}
            {activeTab === 'creacion' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.campos.creacion.map(renderField)}
                </div>
              </div>
            )}

            {/* Tab Notificaciones */}
            {activeTab === 'notificaciones' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="notificarEmail"
                      checked={opciones.notificarEmail || false}
                      onCheckedChange={(checked) => handleOpcionChange('notificarEmail', checked)}
                    />
                    <Label htmlFor="notificarEmail" className="text-sm font-medium">
                      Enviar notificación por email
                    </Label>
                  </div>
                  
                  {opciones.notificarEmail && (
                    <div className="space-y-2">
                      <Label htmlFor="emailNotificacion" className="text-sm font-medium">
                        Email de notificación
                      </Label>
                      <Input
                        id="emailNotificacion"
                        type="email"
                        value={opciones.emailNotificacion || ''}
                        onChange={(e) => handleOpcionChange('emailNotificacion', e.target.value)}
                        placeholder="usuario@empresa.com"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Templates */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Templates de configuración</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    {showTemplates ? 'Cancelar' : 'Guardar Template'}
                  </Button>
                </div>

                {showTemplates && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName" className="text-sm font-medium">
                        Nombre del template
                      </Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Mi configuración personalizada"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={handleSaveTemplate}
                        disabled={!templateName.trim() || isSavingTemplate}
                        size="sm"
                      >
                        {isSavingTemplate ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Template
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTemplates(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Información</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Los templates guardan todas las configuraciones actuales</li>
                    <li>Puedes reutilizar configuraciones frecuentes</li>
                    <li>Los templates son específicos para cada tipo de importación</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="border-t pt-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Configuración avanzada</p>
                <p>
                  Estas opciones te permiten personalizar el comportamiento de la importación. 
                  Los cambios se aplicarán a la próxima importación que realices.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
} 