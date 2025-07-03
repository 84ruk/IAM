import { useState, useCallback, useEffect, useRef } from 'react'
import { z } from 'zod'
import { AppError, ValidationAppError } from '@/lib/errorHandler'

interface ValidationState {
  isValid: boolean
  errors: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
  serverErrors: string[]
}

interface UseFormValidationOptions {
  schema: z.ZodSchema
  debounceMs?: number
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnSubmit?: boolean
  initialData?: Record<string, any>
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  options: UseFormValidationOptions
) {
  const { 
    schema, 
    debounceMs = 300, 
    validateOnChange = true, 
    validateOnBlur = true,
    validateOnSubmit = true,
    initialData: optionsInitialData
  } = options
  
  const [data, setData] = useState<T>(optionsInitialData || initialData)
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: {},
    isDirty: false,
    isSubmitting: false,
    serverErrors: []
  })
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Función de validación
  const validate = useCallback((values: T): ValidationState => {
    try {
      schema.parse(values)
      return {
        isValid: true,
        errors: {},
        isDirty: true,
        isSubmitting: validationState.isSubmitting,
        serverErrors: validationState.serverErrors
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
          isDirty: true,
          isSubmitting: validationState.isSubmitting,
          serverErrors: validationState.serverErrors
        }
      }
      return {
        isValid: false,
        errors: { general: 'Error de validación desconocido' },
        isDirty: true,
        isSubmitting: validationState.isSubmitting,
        serverErrors: validationState.serverErrors
      }
    }
  }, [schema, validationState.isSubmitting, validationState.serverErrors])

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
      isDirty: false,
      isSubmitting: false,
      serverErrors: []
    })
  }, [initialData])

  // Limpiar errores
  const clearErrors = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      errors: {},
      serverErrors: []
    }))
  }, [])

  // Manejar errores del servidor
  const handleServerError = useCallback((error: AppError) => {
    if (error instanceof ValidationAppError && error.errors) {
      const serverErrors: Record<string, string> = {}
      error.errors.forEach(err => {
        serverErrors[err.field] = err.message
      })
      
      setValidationState(prev => ({
        ...prev,
        errors: { ...prev.errors, ...serverErrors },
        serverErrors: error.errors.map(err => err.message)
      }))
    } else {
      setValidationState(prev => ({
        ...prev,
        serverErrors: [error.message]
      }))
    }
  }, [])

  // Función para enviar formulario con manejo de errores
  const submitForm = useCallback(async (
    submitFn: (data: T) => Promise<any>,
    options?: {
      onSuccess?: (result: any) => void
      onError?: (error: AppError) => void
      validateBeforeSubmit?: boolean
    }
  ) => {
    const { onSuccess, onError, validateBeforeSubmit = validateOnSubmit } = options || {}

    try {
      setValidationState(prev => ({ ...prev, isSubmitting: true }))
      clearErrors()

      // Validar antes de enviar si está habilitado
      if (validateBeforeSubmit) {
        const isValid = validateForm()
        if (!isValid) {
          setValidationState(prev => ({ ...prev, isSubmitting: false }))
          return false
        }
      }

      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo abort controller
      abortControllerRef.current = new AbortController()

      const result = await submitFn(data)
      
      setValidationState(prev => ({ ...prev, isSubmitting: false }))
      onSuccess?.(result)
      return result

    } catch (error) {
      setValidationState(prev => ({ ...prev, isSubmitting: false }))
      
      if (error instanceof AppError) {
        handleServerError(error)
        onError?.(error)
      } else {
        const appError = new AppError(error instanceof Error ? error.message : 'Error desconocido')
        handleServerError(appError)
        onError?.(appError)
      }
      
      return false
    }
  }, [data, validateForm, validateOnSubmit, clearErrors, handleServerError])

  // Función para validar campo específico con transformación
  const validateAndTransformField = useCallback((field: keyof T, value: any, transform?: (value: any) => any) => {
    const transformedValue = transform ? transform(value) : value
    const newData = { ...data, [field]: transformedValue }
    
    try {
      // Validar solo el campo específico
      const fieldSchema = schema.shape[field as string]
      if (fieldSchema) {
        fieldSchema.parse(transformedValue)
        setValidationState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [field]: ''
          }
        }))
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === field)
        if (fieldError) {
          setValidationState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              [field]: fieldError.message
            }
          }))
        }
      }
    }
    
    setData(newData)
  }, [data, schema])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
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
    handleServerError,
    submitForm,
    validateAndTransformField,
    isValid: validationState.isValid,
    errors: validationState.errors,
    isDirty: validationState.isDirty,
    isSubmitting: validationState.isSubmitting,
    serverErrors: validationState.serverErrors
  }
} 