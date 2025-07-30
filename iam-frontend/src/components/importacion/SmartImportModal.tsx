'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useImportacionUnified } from '@/hooks/useImportacionUnified'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import ImportacionProgress from './ImportacionProgress'
import ImportacionErrorNotification from './ImportacionErrorNotification'
import ErrorDetailsModal from './ErrorDetailsModal'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Wifi,
  Brain,
  Zap,
  ArrowLeft,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { TipoImportacion, ImportacionResultado } from '@/types/importacion'

interface SmartImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: ImportacionResultado) => void
  onError?: (error: string) => void
}

export default function SmartImportModal({
  isOpen,
  onClose,
  onSuccess,
  onError
}: SmartImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tipoImportacion, setTipoImportacion] = useState<TipoImportacion>('productos')
  const [dragActive, setDragActive] = useState(false)
  const [opciones, setOpciones] = useState({
    sobrescribirExistentes: false,
    validarSolo: false,
    notificarEmail: false,
    emailNotificacion: ''
  })
  
  const [importacionResult, setImportacionResult] = useState<ImportacionResultado | null>(null)
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'importing' | 'result'>('upload')
  
  const { state, importar, cancelarTrabajo, clearState, clearError, clearSuccess } = useImportacionUnified()
  const { toast } = useToast()

  // Limpiar errores y resultados cuando cambia el archivo
  useEffect(() => {
    if (selectedFile) {
      setImportacionResult(null)
      setShowErrorDetailsModal(false)
      clearError()
      setCurrentStep('upload')
    }
  }, [selectedFile, clearError])

  // Actualizar step basado en el estado de importación
  useEffect(() => {
    if (state.isImporting || (state.currentTrabajo && state.currentTrabajo.estado === 'procesando')) {
      setCurrentStep('importing')
    } else if (importacionResult) {
      setCurrentStep('result')
    } else if (selectedFile && !state.isImporting) {
      setCurrentStep('upload')
    }
  }, [state.isImporting, state.currentTrabajo, importacionResult, selectedFile])

  // Función para determinar el modo esperado basado en el tamaño del archivo
  const getModoEsperado = (file: File): 'http' | 'websocket' => {
    const fileSizeMB = file.size / (1024 * 1024)
    return fileSizeMB < 1 ? 'http' : 'websocket'
  }

  // Función para obtener información del archivo
  const getFileInfo = (file: File) => {
    const fileSizeMB = file.size / (1024 * 1024)
    const modoEsperado = getModoEsperado(file)
    const extension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
    
    return {
      nombre: file.name,
      tamaño: fileSizeMB.toFixed(2),
      tipo: file.type,
      extension,
      modoEsperado,
      ultimaModificacion: new Date(file.lastModified).toLocaleDateString()
    }
  }

  // Limpiar estado al cerrar
  const handleClose = useCallback(() => {
    if (state.isImporting && state.currentTrabajo) {
      // Preguntar si quiere cancelar
      if (confirm('¿Estás seguro de que quieres cancelar la importación en curso?')) {
        cancelarTrabajo(state.currentTrabajo.id)
      } else {
        return // No cerrar si no quiere cancelar
      }
    }
    
    setSelectedFile(null)
    setTipoImportacion('productos' as TipoImportacion)
    setOpciones({
      sobrescribirExistentes: false,
      validarSolo: false,
      notificarEmail: false,
      emailNotificacion: ''
    })
    setImportacionResult(null)
    setShowErrorDetailsModal(false)
    setCurrentStep('upload')
    clearState()
    onClose()
  }, [state.isImporting, state.currentTrabajo, cancelarTrabajo, clearState, onClose])

  // Función para limpiar completamente el estado
  const limpiarEstadoCompleto = useCallback(() => {
    setSelectedFile(null)
    setTipoImportacion('productos' as TipoImportacion)
    setOpciones({
      sobrescribirExistentes: false,
      validarSolo: false,
      notificarEmail: false,
      emailNotificacion: ''
    })
    setImportacionResult(null)
    setShowErrorDetailsModal(false)
    setCurrentStep('upload')
    clearState()
    clearError()
    clearSuccess()
  }, [clearState, clearError, clearSuccess])

  // Función para volver atrás
  const handleGoBack = useCallback(() => {
    if (currentStep === 'result') {
      // Desde resultado, volver a upload
      limpiarEstadoCompleto()
    } else if (currentStep === 'importing') {
      // Si está importando, preguntar si quiere cancelar
      if (confirm('¿Estás seguro de que quieres cancelar la importación?')) {
        if (state.currentTrabajo && state.currentTrabajo.estado === 'procesando') {
          cancelarTrabajo(state.currentTrabajo.id)
        }
        limpiarEstadoCompleto()
      }
    } else if (currentStep === 'upload') {
      // Desde upload, cerrar modal
      handleClose()
    }
  }, [currentStep, state.currentTrabajo, cancelarTrabajo, limpiarEstadoCompleto, handleClose])

  // Función para nueva importación
  const handleNuevaImportacion = useCallback(() => {
    limpiarEstadoCompleto()
  }, [limpiarEstadoCompleto])

  // Manejar drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
    }
  }, [])

  // Manejar selección de archivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }, [])

  // Manejar importación
  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo')
      return
    }

    try {
      // Para importación inteligente, usar el tipo seleccionado
      const result = await importar(selectedFile, tipoImportacion as TipoImportacion, opciones)
      
      // Debug: Log del resultado
      console.log('🔍 Resultado de importación:', {
        registrosProcesados: result.registrosProcesados,
        registrosExitosos: result.registrosExitosos,
        registrosConError: result.registrosConError,
        correcciones: result.correcciones?.length || 0,
        errores: result.errores?.length || 0,
        hasErrors: result.hasErrors,
        mensaje: result.mensaje,
        message: result.message,
        data: result.data
      })
      
      // Debug: Log detallado de la estructura
      console.log('🔍 Estructura completa del resultado:', result)
      
      // Guardar resultado para mostrar notificación
      setImportacionResult(result)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      // NO mostrar alertas automáticas - el usuario verá el resultado en la UI
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      if (onError) {
        onError(errorMessage)
      }
      
      // Solo mostrar toast para errores críticos
      toast.error(errorMessage)
    }
  }, [selectedFile, tipoImportacion, opciones, importar, onSuccess, onError, toast])

  // Limpiar errores
  const handleClearError = useCallback(() => {
    clearError()
  }, [clearError])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header fijo */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-100 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStep !== 'upload' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  disabled={state.isImporting}
                  className="p-2 hover:bg-white/60 transition-all duration-200 rounded-full"
                  title="Volver atrás"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Importación Inteligente
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    {currentStep === 'upload' && 'Sube tu archivo y déjanos detectar automáticamente el tipo de datos'}
                    {currentStep === 'importing' && 'Procesando tu archivo con inteligencia artificial...'}
                    {currentStep === 'result' && 'Resultado de la importación inteligente'}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={state.isImporting}
              className="p-2 hover:bg-white/60 transition-all duration-200 rounded-full"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información del modo */}
          {state.modo && currentStep === 'upload' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              {state.modo === 'websocket' ? (
                <Wifi className="w-4 h-4 text-blue-600" />
              ) : (
                <Zap className="w-4 h-4 text-green-600" />
              )}
              <span className="text-sm font-medium">
                Modo: {state.modo === 'websocket' ? 'WebSocket (Seguimiento en tiempo real)' : 'HTTP (Procesamiento rápido)'}
              </span>
            </div>
          )}

          {/* Área de drag and drop - solo mostrar en step upload */}
          {currentStep === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-lg'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 text-lg">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      >
                        Cambiar archivo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-700 font-medium">
                      Arrastra un archivo aquí o{' '}
                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer font-semibold underline decoration-2 underline-offset-2">
                        selecciona uno
                        <input
                          type="file"
                          className="hidden"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      <span>Formatos soportados: Excel (.xlsx, .xls), CSV</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información del archivo - solo mostrar en step upload */}
          {selectedFile && currentStep === 'upload' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Información del archivo</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {(() => {
                  const fileInfo = getFileInfo(selectedFile)
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nombre:</span>
                        <span className="text-sm font-medium">{fileInfo.nombre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tamaño:</span>
                        <span className="text-sm font-medium">{fileInfo.tamaño} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tipo:</span>
                        <span className="text-sm font-medium">{fileInfo.tipo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Última modificación:</span>
                        <span className="text-sm font-medium">{fileInfo.ultimaModificacion}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Modo esperado:</span>
                        <Badge variant={fileInfo.modoEsperado === 'http' ? 'default' : 'secondary'}>
                          {fileInfo.modoEsperado === 'http' ? (
                            <>
                              <Zap className="w-3 h-3 mr-1" />
                              HTTP (Rápido)
                            </>
                          ) : (
                            <>
                              <Wifi className="w-3 h-3 mr-1" />
                              WebSocket
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Formato:</span>
                        <Badge variant="outline">{fileInfo.extension}</Badge>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Selector de tipo de importación - solo mostrar en step upload */}
          {currentStep === 'upload' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Tipo de importación</h4>
              <div className="grid grid-cols-3 gap-2">
                {['productos', 'proveedores', 'movimientos'].map((tipo) => (
                  <Button
                    key={tipo}
                    variant={tipoImportacion === tipo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoImportacion(tipo as TipoImportacion)}
                    className="capitalize"
                  >
                    {tipo}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Opciones de importación - solo mostrar en step upload */}
          {currentStep === 'upload' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Opciones de importación</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={opciones.sobrescribirExistentes}
                    onChange={(e) => setOpciones(prev => ({ ...prev, sobrescribirExistentes: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Sobrescribir registros existentes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={opciones.validarSolo}
                    onChange={(e) => setOpciones(prev => ({ ...prev, validarSolo: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Solo validar (no importar)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={opciones.notificarEmail}
                    onChange={(e) => setOpciones(prev => ({ ...prev, notificarEmail: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Notificar por email</span>
                </label>
                {opciones.notificarEmail && (
                  <input
                    type="email"
                    placeholder="Email para notificación"
                    value={opciones.emailNotificacion}
                    onChange={(e) => setOpciones(prev => ({ ...prev, emailNotificacion: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                )}
              </div>
            </div>
          )}

          {/* Progreso de importación - mostrar cuando hay un trabajo activo */}
          {state.currentTrabajo && (
            <div className="space-y-4">
              <ImportacionProgress
                trabajo={state.currentTrabajo}
                onCancel={cancelarTrabajo}
                onDownloadReport={(trabajoId) => {
                  // Implementar descarga de reporte
                  console.log('Descargar reporte:', trabajoId)
                }}
              />
            </div>
          )}

          {/* Notificación de errores de importación - solo mostrar en step result */}
          {currentStep === 'result' && importacionResult && (
            <ImportacionErrorNotification
              hasErrors={importacionResult.hasErrors || importacionResult.registrosConError > 0 || false}
              errorCount={importacionResult.errorCount || importacionResult.registrosConError || 0}
              successCount={importacionResult.successCount || importacionResult.registrosExitosos || 0}
              errorFile={importacionResult.errorFile}
              message={importacionResult.mensaje || importacionResult.message || `Procesados: ${importacionResult.registrosProcesados || 0}, Exitosos: ${importacionResult.registrosExitosos || 0}, Errores: ${importacionResult.registrosConError || 0}`}
              correcciones={importacionResult.correcciones || importacionResult.data?.correcciones || []}
              onDownloadReport={() => {
                if (importacionResult.errorFile) {
                  // Implementar descarga del archivo de errores
                  console.log('Descargar archivo de errores:', importacionResult.errorFile)
                }
              }}
              onViewDetails={() => setShowErrorDetailsModal(true)}
            />
          )}

          {/* Mensajes de estado - solo mostrar en step upload */}
          {currentStep === 'upload' && state.success && !importacionResult && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">{state.success}</span>
            </div>
          )}

          {currentStep === 'upload' && state.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800 flex-1">{state.error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearError}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}


        </div>

        {/* Footer fijo con botones */}
        <div className="border-t border-gray-100 p-6 flex-shrink-0 bg-gray-50">
          <div className="flex gap-3 justify-end">
            {currentStep === 'upload' && (
              <Button
                onClick={handleImport}
                disabled={!selectedFile || state.isImporting}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {state.isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Importar Inteligentemente
                  </>
                )}
              </Button>
            )}
            
            {currentStep === 'result' && (
              <Button
                onClick={handleNuevaImportacion}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                size="lg"
              >
                <Upload className="w-4 h-4" />
                Nueva Importación
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleClose}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50"
              size="lg"
            >
              {currentStep === 'result' ? 'Cerrar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de detalles de errores */}
      {importacionResult && importacionResult.data && importacionResult.data.errores && (
        <ErrorDetailsModal
          isOpen={showErrorDetailsModal}
          onClose={() => setShowErrorDetailsModal(false)}
          errores={importacionResult.data.errores}
          tipoImportacion={tipoImportacion}
          onDownloadReport={() => {
            if (importacionResult.errorFile) {
              // Implementar descarga del archivo de errores
              console.log('Descargar archivo de errores:', importacionResult.errorFile)
            }
          }}
        />
      )}
    </div>
  )
} 