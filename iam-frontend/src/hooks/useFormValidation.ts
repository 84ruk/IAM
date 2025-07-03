import { useState, useCallback } from 'react'
import { AppError, ValidationAppError } from '@/lib/errorHandler'

// Tipos para validación
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
  sanitize?: boolean
}

export interface ValidationRules {
  [field: string]: ValidationRule
}

export interface ValidationErrors {
  [field: string]: string
}

// Sanitización de entrada
function sanitizeInput(value: any, sanitize: boolean = true): any {
  if (!sanitize || value == null) return value

  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/vbscript:/gi, '')
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeInput(item, sanitize))
  }

  if (typeof value === 'object') {
    const sanitized: any = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeInput(val, sanitize)
    }
    return sanitized
  }

  return value
}

// Validación de campos individuales
function validateField(value: any, rules: ValidationRule): string | null {
  const { required, minLength, maxLength, pattern, custom, sanitize } = rules

  // Sanitizar si es necesario
  const sanitizedValue = sanitizeInput(value, sanitize)

  // Validación requerida
  if (required && (sanitizedValue === '' || sanitizedValue == null || sanitizedValue === undefined)) {
    return 'Este campo es obligatorio'
  }

  // Si no es requerido y está vacío, no validar más
  if (!required && (sanitizedValue === '' || sanitizedValue == null || sanitizedValue === undefined)) {
    return null
  }

  // Validación de longitud mínima
  if (minLength && typeof sanitizedValue === 'string' && sanitizedValue.length < minLength) {
    return `Mínimo ${minLength} caracteres`
  }

  // Validación de longitud máxima
  if (maxLength && typeof sanitizedValue === 'string' && sanitizedValue.length > maxLength) {
    return `Máximo ${maxLength} caracteres`
  }

  // Validación de patrón
  if (pattern && typeof sanitizedValue === 'string' && !pattern.test(sanitizedValue)) {
    return 'Formato inválido'
  }

  // Validación personalizada
  if (custom) {
    const result = custom(sanitizedValue)
    if (result === false) {
      return 'Valor inválido'
    }
    if (typeof result === 'string') {
      return result
    }
  }

  return null
}

// Validación de tipos específicos
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  url: /^https?:\/\/.+/,
  numeric: /^\d+(\.\d+)?$/,
  integer: /^\d+$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  price: /^\d+(\.\d{1,2})?$/,
  sku: /^[A-Z0-9\-_]+$/,
  barcode: /^[0-9]{8,14}$/,
}

export const validationMessages = {
  email: 'Ingresa un email válido',
  phone: 'Ingresa un número de teléfono válido',
  url: 'Ingresa una URL válida',
  numeric: 'Ingresa un número válido',
  integer: 'Ingresa un número entero',
  alphanumeric: 'Solo letras, números y espacios',
  price: 'Ingresa un precio válido',
  sku: 'Solo letras mayúsculas, números, guiones y guiones bajos',
  barcode: 'Ingresa un código de barras válido (8-14 dígitos)',
}

// Hook principal de validación
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: ValidationRules = {}
) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isValidating, setIsValidating] = useState(false)

  // Actualizar campo
  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Validar inmediatamente si hay reglas para este campo
    if (validationRules[field as string]) {
      const error = validateField(value, validationRules[field as string])
      setErrors(prev => {
        const newErrors = { ...prev }
        if (error) {
          newErrors[field as string] = error
        } else {
          delete newErrors[field as string]
        }
        return newErrors
      })
    }
  }, [validationRules])

  // Actualizar múltiples campos
  const updateFields = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }))
    
    // Validar campos actualizados
    const newErrors: ValidationErrors = {}
    Object.entries(updates).forEach(([field, value]) => {
      if (validationRules[field]) {
        const error = validateField(value, validationRules[field])
        if (error) {
          newErrors[field] = error
        }
      }
    })
    
    setErrors(prev => ({ ...prev, ...newErrors }))
  }, [validationRules])

  // Validar todo el formulario
  const validateForm = useCallback((): boolean => {
    setIsValidating(true)
    
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = data[field as keyof T]
      const error = validateField(value, rules)
      
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setIsValidating(false)
    
    return isValid
  }, [data, validationRules])

  // Validar campo específico
  const validateFieldByName = useCallback((field: keyof T): boolean => {
    const rules = validationRules[field as string]
    if (!rules) return true

    const value = data[field]
    const error = validateField(value, rules)
    
    setErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[field as string] = error
      } else {
        delete newErrors[field as string]
      }
      return newErrors
    })
    
    return !error
  }, [data, validationRules])

  // Limpiar errores
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Limpiar error específico
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field as string]
      return newErrors
    })
  }, [])

  // Resetear formulario
  const resetForm = useCallback((newData?: T) => {
    setData(newData || initialData)
    setErrors({})
  }, [initialData])

  // Obtener datos sanitizados
  const getSanitizedData = useCallback((): T => {
    const sanitized: any = {}
    Object.entries(data).forEach(([field, value]) => {
      const rules = validationRules[field]
      sanitized[field] = sanitizeInput(value, rules?.sanitize)
    })
    return sanitized
  }, [data, validationRules])

  // Verificar si hay errores
  const hasErrors = Object.keys(errors).length > 0

  // Verificar si un campo específico tiene error
  const hasError = useCallback((field: keyof T): boolean => {
    return !!errors[field as string]
  }, [errors])

  // Obtener error de un campo específico
  const getError = useCallback((field: keyof T): string | undefined => {
    return errors[field as string]
  }, [errors])

  return {
    data,
    errors,
    isValidating,
    hasErrors,
    updateField,
    updateFields,
    validateForm,
    validateFieldByName,
    clearErrors,
    clearError,
    resetForm,
    getSanitizedData,
    hasError,
    getError,
  }
}

// Hook para manejo de errores de API en formularios
export function useFormErrorHandler() {
  const handleApiError = useCallback((error: unknown): ValidationErrors => {
    if (error instanceof ValidationAppError && error.errors) {
      const validationErrors: ValidationErrors = {}
      error.errors.forEach(err => {
        validationErrors[err.field] = err.message
      })
      return validationErrors
    }
    
    if (error instanceof AppError) {
      return { general: error.message }
    }
    
    return { general: 'Ha ocurrido un error inesperado' }
  }, [])

  return { handleApiError }
} 