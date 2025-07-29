'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Package,
  ShoppingCart,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Info,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Brain,
  Target
} from 'lucide-react'
import { useImportacionUnified } from '@/hooks/useImportacionUnified'
import { useFileDrop } from '@/hooks/useFileDrop'
import { DEFAULT_IMPORTACION_OPTIONS } from '@/config/importacion.config'
import BaseImportModal, { WebSocketAlert } from './base/BaseImportModal'
import FileUploadArea from './base/FileUploadArea'
import ProgressBar from './ProgressBar'
import ImportOptions from './ImportOptions'

interface AutoImportModalProps {
  isOpen: boolean
  onClose: () => void
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    description: 'Catálogo de productos',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Lista de proveedores',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Movimientos de inventario',
    icon: Activity,
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800'
  }
}

export default function AutoImportModal({ isOpen, onClose }: AutoImportModalProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [opciones, setOpciones] = useState({
    sobrescribirExistentes: false,
    validarSolo: false,
    notificarEmail: false,
    emailNotificacion: '',
    configuracionEspecifica: {}
  })
  const [showOptions, setShowOptions] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  
  // Hook unificado de importación
  const {
    isImporting,
    currentTrabajo,
    error,
    success,
    validationErrors,
    deteccionTipo,
    isConnected,
    importarAutomatica,
    validarAutomatica,
    confirmarAutomatica,
    descargarPlantilla,
    clearError,
    clearSuccess,
    clearValidationErrors,
    clearDeteccionTipo,
    subscribeToTrabajo
  } = useImportacionUnified()

  // Definir handleFileSelect ANTES de usarlo en useFileDrop
  const handleFileSelect = useCallback(async (file: File) => {
    setArchivo(file)
    setIsValidating(true)
    clearError()
    clearSuccess()
    clearValidationErrors()
    clearDeteccionTipo()
    
    try {
      const resultado = await validarAutomatica(file)
      if (resultado) {
        setNeedsConfirmation(resultado.necesitaConfirmacion)
      }
    } catch (error) {
      console.error('Error al validar archivo:', error)
    } finally {
      setIsValidating(false)
    }
  }, [validarAutomatica, clearError, clearSuccess, clearValidationErrors, clearDeteccionTipo])
  
  // Hook de drag & drop (ahora handleFileSelect ya está definido)
  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useFileDrop({
    onFileSelect: handleFileSelect,
    accept: '.xlsx,.xls,.numbers,.csv',
    maxSize: 10
  })

  // Suscribirse al trabajo actual cuando esté disponible
  useEffect(() => {
    if (currentTrabajo?.id) {
      subscribeToTrabajo(currentTrabajo.id)
    }
  }, [currentTrabajo?.id, subscribeToTrabajo])

  const handleFileRemove = useCallback(() => {
    setArchivo(null)
    setNeedsConfirmation(false)
    clearDeteccionTipo()
  }, [clearDeteccionTipo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!archivo) {
      return
    }

    try {
      await importarAutomatica(archivo, opciones)
    } catch (error) {
      console.error('Error en importación:', error)
    }
  }

  const handleDescargarPlantilla = async () => {
    if (deteccionTipo?.tipoDetectado) {
      await descargarPlantilla(deteccionTipo.tipoDetectado)
    }
  }

  const handleClose = () => {
    setArchivo(null)
    setOpciones({
      sobrescribirExistentes: false,
      validarSolo: false,
      notificarEmail: false,
      emailNotificacion: '',
      configuracionEspecifica: {}
    })
    setShowOptions(false)
    setIsValidating(false)
    setNeedsConfirmation(false)
    clearError()
    clearSuccess()
    clearValidationErrors()
    clearDeteccionTipo()
    onClose()
  }

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 80) return 'text-green-600'
    if (confianza >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfianzaText = (confianza: number) => {
    if (confianza >= 80) return 'Alta'
    if (confianza >= 60) return 'Media'
    return 'Baja'
  }

  return (
    <BaseImportModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importación Inteligente"
      subtitle="Sube tu archivo y déjanos detectar automáticamente el tipo de datos"
      showWebSocketStatus={true}
    >

        <WebSocketAlert isConnected={isConnected} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Área de Subida de Archivo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccionar archivo
              </h3>
              {deteccionTipo?.tipoDetectado && (
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar plantilla mejorada
                </button>
              )}
            </div>

            <FileUploadArea
              file={archivo}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              accept=".xlsx,.xls,.numbers,.csv"
              maxSize={10}
              showFileInfo={true}
            />
          </div>

            {/* Detección de Tipo */}
            {isValidating && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="font-medium text-blue-900">Analizando archivo...</p>
                    <p className="text-sm text-blue-700">Detectando tipo de datos automáticamente</p>
                  </div>
                </div>
              </div>
            )}

            {deteccionTipo && !isValidating && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Tipo Detectado</h3>
                  </div>
                  
                  {deteccionTipo.tipoDetectado && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      {(() => {
                        const tipo = deteccionTipo.tipoDetectado as keyof typeof tipoConfig
                        const config = tipoConfig[tipo]
                        if (!config) return null
                        
                        return (
                          <>
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              {React.createElement(config.icon, { 
                                className: "w-5 h-5 text-white" 
                              })}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {config.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                {config.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={config.badgeColor}>
                                {deteccionTipo.tipoDetectado}
                              </Badge>
                              <div className="mt-1">
                                <span className={`text-xs font-medium ${getConfianzaColor(deteccionTipo.confianza)}`}>
                                  Confianza: {getConfianzaText(deteccionTipo.confianza)} ({deteccionTipo.confianza}%)
                                </span>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Razones de detección */}
                  {deteccionTipo.razones && deteccionTipo.razones.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Razones de detección:</p>
                      <ul className="space-y-1">
                        {deteccionTipo.razones.map((razon: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {razon}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Necesita confirmación */}
                  {needsConfirmation && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          La detección automática no es completamente segura. Por favor, confirma el tipo de datos.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sugerencias */}
                  {deteccionTipo.sugerencias && deteccionTipo.sugerencias.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Sugerencias:</p>
                      <ul className="space-y-1">
                        {deteccionTipo.sugerencias.map((sugerencia: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <Info className="w-3 h-3 text-blue-500" />
                            {sugerencia}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opciones Avanzadas */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Info className="w-4 h-4" />
                Opciones avanzadas
                {showOptions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showOptions && (
                <ImportOptions
                  opciones={opciones}
                  onOpcionesChange={setOpciones}
                />
              )}
            </div>

            {/* Barra de Progreso */}
            {isImporting && currentTrabajo && (
                              <ProgressBar 
                  progreso={currentTrabajo?.progreso || 0}
                  estado={currentTrabajo?.estado || 'PENDIENTE'}
                />
            )}

            {/* Mensajes de Error/Success */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">{success}</span>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!archivo || isImporting || isValidating}
                className="bg-gradient-to-r from-[#8E94F2] to-[#7278e0] hover:from-[#7278e0] hover:to-[#8E94F2]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importando...
                  </>
                ) : isValidating ? (
                  <>
                    <Brain className="w-4 h-4 animate-pulse mr-2" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Importar Automáticamente
                  </>
                )}
              </Button>
            </div>
          </form>
    </BaseImportModal>
  )
} 