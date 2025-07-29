'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { 
  Upload, 
  FileText, 
  Database, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  X
} from 'lucide-react'
import { useOptimizedImportacion } from '@/hooks/useOptimizedImportacion'
import FileAnalysisCard from './FileAnalysisCard'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'

interface OptimizedImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function OptimizedImportModal({
  isOpen,
  onClose,
  onSuccess
}: OptimizedImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTipo, setSelectedTipo] = useState<TipoImportacion>('productos')
  const [dragOver, setDragOver] = useState(false)
  
  const {
    isImporting,
    error,
    success,
    currentAnalysis,
    isAnalyzing,
    analyzeFile,
    importarOptimized,
    clearAnalysis,
    clearError,
    clearSuccess
  } = useOptimizedImportacion()

  // Manejar selección de archivo
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file)
    clearAnalysis()
    clearError()
    clearSuccess()
    
    try {
      await analyzeFile(file, selectedTipo)
    } catch (error) {
      console.error('Error analizando archivo:', error)
    }
  }, [selectedTipo, analyzeFile, clearAnalysis, clearError, clearSuccess])

  // Manejar drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Manejar input de archivo
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Manejar cambio de tipo
  const handleTipoChange = useCallback(async (tipo: TipoImportacion) => {
    setSelectedTipo(tipo)
    if (selectedFile) {
      clearAnalysis()
      try {
        await analyzeFile(selectedFile, tipo)
      } catch (error) {
        console.error('Error re-analizando archivo:', error)
      }
    }
  }, [selectedFile, analyzeFile, clearAnalysis])

  // Manejar importación
  const handleImport = useCallback(async () => {
    if (!selectedFile) return
    
    try {
      await importarOptimized(selectedFile, selectedTipo)
      onSuccess?.()
    } catch (error) {
      console.error('Error en importación:', error)
    }
  }, [selectedFile, selectedTipo, importarOptimized, onSuccess])

  // Manejar cierre
  const handleClose = useCallback(() => {
    setSelectedFile(null)
    setSelectedTipo('productos')
    setDragOver(false)
    clearAnalysis()
    clearError()
    clearSuccess()
    onClose()
  }, [clearAnalysis, clearError, clearSuccess, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importación Optimizada
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo - Selección de archivo */}
          <div className="space-y-4">
            {/* Selector de tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Importación</label>
              <Select 
                value={selectedTipo} 
                onChange={(e) => handleTipoChange(e.target.value as TipoImportacion)}
                options={[
                  { value: 'productos', label: 'Productos' },
                  { value: 'proveedores', label: 'Proveedores' },
                  { value: 'movimientos', label: 'Movimientos' },
                  { value: 'categorias', label: 'Categorías' }
                ]}
              />
            </div>

            {/* Área de drag & drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Arrastra y suelta tu archivo aquí, o
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={isImporting}
              >
                Seleccionar Archivo
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv,.numbers"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Archivo seleccionado */}
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium flex-1">{selectedFile.name}</span>
                <Badge variant="outline" className="text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={isImporting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Botón de importación */}
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting || isAnalyzing}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>

            {/* Progreso */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Procesando...</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="w-full" />
              </div>
            )}
          </div>

          {/* Panel derecho - Análisis */}
          <div className="space-y-4">
            <FileAnalysisCard
              file={selectedFile}
              tipo={selectedTipo}
              needsWebSocket={currentAnalysis?.needsWebSocket || false}
              reason={currentAnalysis?.reason || ''}
              estimatedRecords={currentAnalysis?.estimatedRecords}
              estimatedTime={currentAnalysis?.estimatedTime}
            />

            {/* Estado de conexión */}
            {currentAnalysis && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Estado de Conexión</h4>
                <div className="flex items-center gap-2">
                  {currentAnalysis.needsWebSocket ? (
                    <>
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">WebSocket activo</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">HTTP directo</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mensajes de estado */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {isAnalyzing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Analizando archivo...</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 