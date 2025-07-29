'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useSmartImportacion } from '@/hooks/useSmartImportacion'
import { analyzeFile, validateFileForAnalysis, ImportacionAnalysis } from '@/utils/importacionAnalysis'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import { toast } from 'sonner'

interface SmartImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: any) => void
}

export default function SmartImportModal({ isOpen, onClose, onSuccess }: SmartImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTipo, setSelectedTipo] = useState<TipoImportacion>('productos')
  const [analysis, setAnalysis] = useState<ImportacionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const { state, importar, clearState, clearError } = useSmartImportacion()

  // Analizar archivo cuando se selecciona
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    setIsAnalyzing(true)
    clearError()

    try {
      // Validar archivo
      const validation = validateFileForAnalysis(file)
      if (!validation.valid) {
        toast.error(validation.error || 'Archivo inválido')
        setSelectedFile(null)
        return
      }

      // Analizar archivo
      const fileAnalysis = await analyzeFile(file, selectedTipo)
      setAnalysis(fileAnalysis)

      // Mostrar resultado del análisis
      if (fileAnalysis.needsWebSocket) {
        toast.info(`Archivo grande detectado: ${fileAnalysis.reason}`)
      } else {
        toast.success(`Archivo pequeño: ${fileAnalysis.reason}`)
      }
    } catch (error) {
      toast.error('Error analizando archivo')
      console.error('Error analizando archivo:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedTipo, clearError])

  // Manejar cambio de tipo
  const handleTipoChange = useCallback(async (tipo: TipoImportacion) => {
    setSelectedTipo(tipo)
    
    if (selectedFile) {
      // Re-analizar con el nuevo tipo
      setIsAnalyzing(true)
      try {
        const fileAnalysis = await analyzeFile(selectedFile, tipo)
        setAnalysis(fileAnalysis)
      } catch (error) {
        toast.error('Error re-analizando archivo')
      } finally {
        setIsAnalyzing(false)
      }
    }
  }, [selectedFile])

  // Importar archivo
  const handleImport = useCallback(async () => {
    if (!selectedFile || !analysis) {
      toast.error('Selecciona un archivo válido')
      return
    }

    try {
      const result = await importar(selectedFile, selectedTipo)
      
      toast.success('Importación iniciada correctamente')
      onSuccess?.(result)
      onClose()
      clearState()
    } catch (error) {
      toast.error('Error iniciando importación')
      console.error('Error en importación:', error)
    }
  }, [selectedFile, analysis, selectedTipo, importar, onSuccess, onClose, clearState])

  // Limpiar al cerrar
  const handleClose = useCallback(() => {
    setSelectedFile(null)
    setAnalysis(null)
    clearState()
    onClose()
  }, [clearState, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Importación Inteligente</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Selección de archivo */}
          <div>
            <h3 className="font-medium mb-2">1. Seleccionar Archivo</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.numbers"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-gray-600">
                  {selectedFile ? (
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p>Haz clic para seleccionar un archivo</p>
                      <p className="text-sm text-gray-500">Excel, CSV o Numbers (máx. 100MB)</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Selección de tipo */}
          <div>
            <h3 className="font-medium mb-2">2. Tipo de Importación</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['productos', 'proveedores', 'movimientos'] as TipoImportacion[]).map((tipo) => (
                <Button
                  key={tipo}
                  variant={selectedTipo === tipo ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTipoChange(tipo)}
                  disabled={isAnalyzing}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Análisis del archivo */}
          {isAnalyzing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Analizando archivo...</p>
            </div>
          )}

          {analysis && (
            <div>
              <h3 className="font-medium mb-2">3. Análisis del Archivo</h3>
              <Card className="bg-gray-50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Modo recomendado:</span>
                    <Badge variant={analysis.needsWebSocket ? "default" : "secondary"}>
                      {analysis.recommendedMode.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Registros estimados:</span>
                    <span className="font-medium">{analysis.estimatedRecords.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tamaño:</span>
                    <span className="font-medium">{(analysis.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Complejidad:</span>
                    <Badge variant={
                      analysis.complexity === 'simple' ? "default" :
                      analysis.complexity === 'medium' ? "secondary" : "destructive"
                    }>
                      {analysis.complexity}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tiempo estimado:</span>
                    <span className="font-medium">{Math.round(analysis.estimatedTime / 1000)}s</span>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{analysis.reason}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Información del modo */}
          {analysis && (
            <div>
              <h3 className="font-medium mb-2">4. Información del Modo</h3>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  {analysis.needsWebSocket ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">Modo WebSocket (Seguimiento en Tiempo Real)</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Verás el progreso en tiempo real</li>
                        <li>• Puedes cancelar la importación</li>
                        <li>• Notificaciones detalladas</li>
                        <li>• Ideal para archivos grandes</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Modo HTTP (Procesamiento Rápido)</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Procesamiento inmediato</li>
                        <li>• Resultado rápido</li>
                        <li>• Sin seguimiento en tiempo real</li>
                        <li>• Ideal para archivos pequeños</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Estado de importación */}
          {state.isImporting && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Iniciando importación...</p>
            </div>
          )}

          {/* Errores */}
          {state.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={state.isImporting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedFile || !analysis || state.isImporting || isAnalyzing}
            >
              {state.isImporting ? 'Iniciando...' : 'Importar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 