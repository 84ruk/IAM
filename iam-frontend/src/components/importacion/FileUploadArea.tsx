'use client'

import React, { useCallback } from 'react'
import Button from '@/components/ui/Button'
import { 
  Upload, 
  X, 
  CheckCircle
} from 'lucide-react'
import { getAcceptedFileTypes } from '@/types/fileTypes'
import { useFileValidation } from '@/hooks/useFileValidation'

interface FileUploadAreaProps {
  file: File | null
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  className?: string
  accept?: string
  maxSizeMB?: number
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  file,
  onFileSelect,
  onFileRemove,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  className = '',
  accept,
  maxSizeMB = 50
}) => {
  const { getFileSizeMB } = useFileValidation({ maxSizeMB })
  const acceptedTypes = accept || getAcceptedFileTypes()

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }, [onFileSelect])

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragOver 
          ? 'border-blue-500 bg-blue-50' 
          : file 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div className="text-left">
            <p className="font-medium text-green-900">{file.name}</p>
            <p className="text-sm text-green-700">
              {getFileSizeMB(file)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onFileRemove}
            aria-label="Eliminar archivo"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div>
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 mb-2">
            Arrastra y suelta tu archivo aquí, o
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Seleccionar archivo
          </Button>
          <input
            id="file-upload"
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-2">
            Formatos soportados: Excel (.xlsx, .xls, .numbers) y CSV
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUploadArea 