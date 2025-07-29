'use client'

import { useState, useCallback } from 'react'

interface UseFileDropOptions {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // en MB
}

interface UseFileDropReturn {
  isDragOver: boolean
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const useFileDrop = ({ 
  onFileSelect, 
  accept = '.xlsx,.xls,.numbers,.csv',
  maxSize = 10 
}: UseFileDropOptions): UseFileDropReturn => {
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFile = useCallback((file: File): boolean => {
    // Validar tipo de archivo
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type)
      }
      return file.type === type
    })

    if (!isValidType) {
      console.warn(`Tipo de archivo no soportado: ${file.type}`)
      return false
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      console.warn(`Archivo demasiado grande: ${fileSizeMB.toFixed(2)}MB (máximo ${maxSize}MB)`)
      return false
    }

    return true
  }, [accept, maxSize])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }, [onFileSelect, validateFile])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      onFileSelect(file)
    }
  }, [onFileSelect, validateFile])

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange
  }
} 