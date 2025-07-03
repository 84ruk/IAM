import { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'

interface ValidationState {
  isValid: boolean
  errors: Record<string, string>
  isDirty: boolean
}

interface UseFormValidationOptions {
  schema: z.ZodSchema
  debounceMs?: number
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  options: UseFormValidationOptions
) {
  const { schema, debounceMs = 300, validateOnChange = true, validateOnBlur = true } = options
  
  const [data, setData] = useState<T>(initialData)
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: {},
    isDirty: false
  })
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Función de validación
  const validate = useCallback((values: T): ValidationState => {
    try {
      schema.parse(values)
      return {
        isValid: true,
        errors: {},
        isDirty: true
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          errors[path] = err.message
        })
        return {
          isValid: false,
          errors,
          isDirty: true
        }
      }
      return {
        isValid: false,
        errors: { general: 'Error de validación desconocido' },
        isDirty: true
      }
    }
  }, [schema])

  // Validación con debounce
  const validateWithDebounce = useCallback((values: T) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      const result = validate(values)
      setValidationState(result)
    }, debounceMs)

    setDebounceTimer(timer)
  }, [validate, debounceMs, debounceTimer])

  // Actualizar campo
  const updateField = useCallback((field: keyof T, value: any) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    
    if (validateOnChange) {
      validateWithDebounce(newData)
    }
  }, [data, validateOnChange, validateWithDebounce])

  // Validar campo específico
  const validateField = useCallback((field: keyof T) => {
    const result = validate(data)
    const fieldError = result.errors[field as string] || ''
    
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: fieldError
      }
    }))
  }, [data, validate])

  // Validar en blur
  const handleBlur = useCallback((field: keyof T) => {
    if (validateOnBlur) {
      validateField(field)
    }
  }, [validateOnBlur, validateField])

  // Validar todo el formulario
  const validateForm = useCallback(() => {
    const result = validate(data)
    setValidationState(result)
    return result.isValid
  }, [data, validate])

  // Resetear formulario
  const reset = useCallback((newData?: T) => {
    const resetData = newData || initialData
    setData(resetData)
    setValidationState({
      isValid: false,
      errors: {},
      isDirty: false
    })
  }, [initialData])

  // Limpiar errores
  const clearErrors = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      errors: {}
    }))
  }, [])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return {
    data,
    validationState,
    updateField,
    validateField,
    validateForm,
    handleBlur,
    reset,
    clearErrors,
    isValid: validationState.isValid,
    errors: validationState.errors,
    isDirty: validationState.isDirty
  }
} 