'use client'

import React, { useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useFileDrop } from '@/hooks/useFileDrop'

interface FileUploadAreaProps {
  file: File | null
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  accept?: string
  maxSize?: number
  className?: string
  showFileInfo?: boolean
}

export default function FileUploadArea({
  file,
  onFileSelect,
  onFileRemove,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  accept = '.xlsx,.xls,.numbers,.csv',
  maxSize = 10,
  className = '',
  showFileInfo = true
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { handleFileInputChange } = useFileDrop({
    onFileSelect,
    accept,
    maxSize
  })

  const getFileSizeMB = (file: File) => {
    return (file.size / (1024 * 1024)).toFixed(2)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <FileText className="w-8 h-8 text-green-600" />
      case 'numbers':
        return <FileText className="w-8 h-8 text-orange-600" />
      case 'csv':
        return <FileText className="w-8 h-8 text-blue-600" />
      default:
        return <FileText className="w-8 h-8 text-gray-600" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de Drag & Drop */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : file 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <CardContent className="p-6">
          {!file ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Upload className="w-12 h-12 text-gray-400" />
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Formatos soportados: {accept.replace(/\./g, '').toUpperCase()}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(file.name)}
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {getFileSizeMB(file)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onFileRemove}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del archivo */}
      {showFileInfo && file && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Información del archivo</h4>
            <Badge variant="outline" className="text-xs">
              {file.name.split('.').pop()?.toUpperCase()}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nombre:</span>
              <p className="font-medium">{file.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Tamaño:</span>
              <p className="font-medium">{getFileSizeMB(file)} MB</p>
            </div>
            <div>
              <span className="text-gray-600">Tipo:</span>
              <p className="font-medium">{file.type || 'No especificado'}</p>
            </div>
            <div>
              <span className="text-gray-600">Última modificación:</span>
              <p className="font-medium">
                {new Date(file.lastModified).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
} 