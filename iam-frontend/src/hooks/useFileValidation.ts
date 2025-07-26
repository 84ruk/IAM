import { useCallback } from 'react'
import { validateFileType, getFileTypeInfo, type FileTypeInfo } from '@/types/fileTypes'

interface UseFileValidationOptions {
  maxSizeMB?: number
  showAlert?: boolean
}

interface ValidationResult {
  isValid: boolean
  error?: string
  fileType?: FileTypeInfo
}

export const useFileValidation = (options: UseFileValidationOptions = {}) => {
  const { maxSizeMB = 50, showAlert = true } = options

  const validateFile = useCallback((file: File): ValidationResult => {
    // Validar tipo de archivo
    if (!validateFileType(file)) {
      const error = `Solo se permiten archivos Excel (.xlsx, .xls, .numbers) o CSV`
      if (showAlert) {
        alert(error)
      }
      return { isValid: false, error }
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      const error = `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`
      if (showAlert) {
        alert(error)
      }
      return { isValid: false, error }
    }

    // Obtener información del tipo de archivo
    const fileType = getFileTypeInfo(file)

    return { 
      isValid: true, 
      fileType 
    }
  }, [maxSizeMB, showAlert])

  const isNumbersFile = useCallback((file: File): boolean => {
    const fileType = getFileTypeInfo(file)
    return fileType?.extension === '.numbers'
  }, [])

  const getFileSizeMB = useCallback((file: File): number => {
    return Number((file.size / 1024 / 1024).toFixed(2))
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  return {
    validateFile,
    isNumbersFile,
    getFileSizeMB,
    formatFileSize
  }
} 