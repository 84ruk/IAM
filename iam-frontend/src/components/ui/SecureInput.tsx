import React, { forwardRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Tipos de validación
export interface InputValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => boolean | string
  sanitize?: boolean
}

// Props del componente
export interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  label?: string
  error?: string
  validation?: InputValidation
  onChange?: (value: string, isValid: boolean) => void
  onBlur?: (value: string, isValid: boolean) => void
  showPasswordToggle?: boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// Sanitización de entrada
function sanitizeInput(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
}

// Validación de campo
function validateInput(value: string, validation?: InputValidation): string | null {
  if (!validation) return null

  const { required, minLength, maxLength, pattern, custom, sanitize } = validation

  // Sanitizar si es necesario
  const sanitizedValue = sanitize ? sanitizeInput(value) : value

  // Validación requerida
  if (required && (!sanitizedValue || sanitizedValue.trim() === '')) {
    return 'Este campo es obligatorio'
  }

  // Si no es requerido y está vacío, no validar más
  if (!required && (!sanitizedValue || sanitizedValue.trim() === '')) {
    return null
  }

  // Validación de longitud mínima
  if (minLength && sanitizedValue.length < minLength) {
    return `Mínimo ${minLength} caracteres`
  }

  // Validación de longitud máxima
  if (maxLength && sanitizedValue.length > maxLength) {
    return `Máximo ${maxLength} caracteres`
  }

  // Validación de patrón
  if (pattern && !pattern.test(sanitizedValue)) {
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

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  (
    {
      label,
      error,
      validation,
      onChange,
      onBlur,
      showPasswordToggle = false,
      helperText,
      leftIcon,
      rightIcon,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [internalError, setInternalError] = useState<string | null>(null)
    const [isFocused, setIsFocused] = useState(false)

    // Manejar cambio de valor
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const error = validateInput(value, validation)
      setInternalError(error)

      // Llamar onChange con valor y estado de validación
      onChange?.(value, !error)
    }, [validation, onChange])

    // Manejar blur
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      const value = e.target.value
      const error = validateInput(value, validation)
      setInternalError(error)

      // Llamar onBlur con valor y estado de validación
      onBlur?.(value, !error)
    }, [validation, onBlur])

    // Manejar focus
    const handleFocus = useCallback(() => {
      setIsFocused(true)
    }, [])

    // Toggle de contraseña
    const togglePassword = useCallback(() => {
      setShowPassword(prev => !prev)
    }, [])

    // Determinar el tipo de input
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type

    // Determinar si hay error
    const hasError = error || internalError

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {validation?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-3 py-2 border rounded-lg transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              leftIcon ? "pl-10" : "",
              (rightIcon || showPasswordToggle) ? "pr-10" : "",
              hasError
                ? "border-red-300 focus:ring-red-500"
                : isFocused
                ? "border-[#8E94F2]"
                : "border-gray-300 hover:border-gray-400",
              className
            )}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            {...props}
          />
          
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        
        {(hasError || helperText) && (
          <div className="mt-1">
            {hasError && (
              <p className="text-sm text-red-600">
                {hasError}
              </p>
            )}
            {helperText && !hasError && (
              <p className="text-sm text-gray-500">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

SecureInput.displayName = 'SecureInput' 