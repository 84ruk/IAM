'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { AlertCircle, Loader2, CheckCircle, ArrowLeft, Building2, User, Clock, Check, X } from 'lucide-react'
import { AppError } from '@/lib/errorHandler'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Link from 'next/link'

interface RegisterFormData {
  nombre: string
  email: string
  password: string
  confirmPassword: string
  [key: string]: unknown
}

interface FieldErrors {
  nombre?: string
  email?: string
  password?: string
  confirmPassword?: string
}

interface PasswordRequirement {
  id: string
  label: string
  validator: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Al menos 12 caracteres',
    validator: (password: string) => password.length >= 12
  },
  {
    id: 'lowercase',
    label: 'Al menos una minúscula',
    validator: (password: string) => /[a-z]/.test(password)
  },
  {
    id: 'uppercase',
    label: 'Al menos una mayúscula',
    validator: (password: string) => /[A-Z]/.test(password)
  },
  {
    id: 'number',
    label: 'Al menos un número',
    validator: (password: string) => /\d/.test(password)
  },
  {
    id: 'symbol',
    label: 'Al menos un símbolo (@$!%*?&)',
    validator: (password: string) => /[@$!%*?&]/.test(password)
  }
]

export default function RegisterForm() {
  const [data, setData] = useState<RegisterFormData>({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [validationErrors, setValidationErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  const updateField = useCallback((field: keyof FieldErrors, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [validationErrors])

  const isValidationAppError = useCallback((error: unknown): error is { name: string; errors: { field: string; message: string }[] } => {
    return typeof error === 'object' && error !== null && (error as Record<string, unknown>).name === 'ValidationAppError' && 'errors' in error
  }, [])

  const validateForm = useCallback((): boolean => {
    const errors: FieldErrors = {}

    if (!data.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
    } else if (data.nombre.length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (data.nombre.length > 50) {
      errors.nombre = 'El nombre no puede exceder 50 caracteres'
    } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/.test(data.nombre)) {
      errors.nombre = 'El nombre contiene caracteres no permitidos'
    }

    if (!data.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'El email no es válido'
    }

    if (!data.password) {
      errors.password = 'La contraseña es requerida'
    } else if (data.password.length < 12) {
      errors.password = 'La contraseña debe tener al menos 12 caracteres'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(data.password)) {
      errors.password = 'La contraseña debe contener mayúsculas, minúsculas, números y símbolos (@$!%*?&)'
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña'
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [data.nombre, data.email, data.password, data.confirmPassword])

  // Validar formulario en tiempo real con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const isValid = validateForm()
      setIsFormValid(isValid)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [data.nombre, data.email, data.password, data.confirmPassword, validateForm])

  const handleBackendError = useCallback((result: unknown) => {
    if (isValidationAppError(result)) {
      const fieldErrors: FieldErrors = {}
      result.errors.forEach(error => {
        fieldErrors[error.field as keyof FieldErrors] = error.message
      })
      setValidationErrors(fieldErrors)
    } else if (result instanceof AppError) {
      setGeneralError(result.message)
    } else if (typeof result === 'object' && result !== null) {
      const errorData = result as Record<string, unknown>
      
      // Manejar errores específicos del backend
      if ('message' in errorData && errorData.message) {
        const message = typeof errorData.message === 'string' ? errorData.message : 'Error de registro'
        
        // Manejar errores específicos de correo duplicado
        if (message.toLowerCase().includes('correo') || message.toLowerCase().includes('email')) {
          setValidationErrors(prev => ({
            ...prev,
            email: message
          }))
          return
        }
        
        // Manejar errores de validación de campos específicos
        if ('details' in errorData && errorData.details && typeof errorData.details === 'object') {
          const details = errorData.details as Record<string, unknown>
          if ('field' in details && typeof details.field === 'string') {
            const field = details.field as keyof FieldErrors
            setValidationErrors(prev => ({
              ...prev,
              [field]: message
            }))
            return
          }
        }
        
        setGeneralError(message)
      } else {
        setGeneralError('Error inesperado durante el registro')
      }
    } else {
      setGeneralError('Error inesperado durante el registro')
    }
  }, [isValidationAppError])

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setGeneralError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: data.nombre,
          email: data.email,
          password: data.password
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Guardar el token JWT en las cookies si el backend lo devuelve
        if (result.token) {
          // Configurar cookie con el token
          const isProduction = process.env.NODE_ENV === 'production'
          const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 
            (isProduction ? '.iaminventario.com.mx' : 'localhost')
          
          document.cookie = `jwt=${result.token}; path=/; domain=${cookieDomain}; max-age=${60 * 60 * 24}; ${isProduction ? 'secure; samesite=none' : 'samesite=lax'}`
        }
        
        setShowSuccess(true)
        setTimeout(() => {
          window.location.href = '/setup-empresa'
        }, 2000)
      } else {
        handleBackendError(result)
      }
    } catch {
      setGeneralError('Error de conexión. Verifica tu conexión a internet.')
    } finally {
      setIsLoading(false)
    }
  }, [data, isLoading, handleBackendError, validateForm])

  const getFieldError = useCallback((field: keyof FieldErrors) => {
    return validationErrors[field] || ''
  }, [validationErrors])

  // Handlers optimizados para evitar re-renderizaciones
  const handleNombreChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('nombre', e.target.value)
  }, [updateField])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('email', e.target.value)
  }, [updateField])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('password', e.target.value)
  }, [updateField])

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('confirmPassword', e.target.value)
  }, [updateField])

  // Componente de requisitos de contraseña optimizado
  const PasswordRequirements = useMemo(() => {
    if (!data.password) return null

    const requirements = PASSWORD_REQUIREMENTS.map(req => ({
      ...req,
      isValid: req.validator(data.password)
    }))

    const allValid = requirements.every(req => req.isValid)

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Requisitos de contraseña:</p>
        <div className="space-y-1">
          {requirements.map(req => (
            <div key={req.id} className="flex items-center gap-2">
              {req.isValid ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className={`text-xs ${req.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
        {allValid && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-green-700 font-medium">✓ Contraseña cumple todos los requisitos</p>
          </div>
        )}
      </div>
    )
  }, [data.password])

  if (isLoading && !showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Creando tu cuenta...</p>
        </div>
      </div>
    );
  }

          if (showSuccess) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
                <p className="text-gray-600">¡Cuenta creada exitosamente!</p>
                <p className="text-sm text-gray-500">Redirigiendo a configuración de empresa...</p>
              </div>
            </div>
          );
        }

  return (
    <div className="form-container">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al inicio
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Crear cuenta</h1>
        
        {/* Selector de tipo de registro */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de registro
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="p-3 rounded-lg border-2 border-[#8E94F2] bg-[#8E94F2] text-white cursor-default"
            >
              <User className="w-5 h-5 mx-auto mb-2" />
              <span className="text-sm font-medium">Individual</span>
            </button>
            <button
              type="button"
              disabled
              className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed relative"
            >
              <Building2 className="w-5 h-5 mx-auto mb-2" />
              <span className="text-sm font-medium">Con Empresa</span>
              <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
              </div>
              <span className="text-xs text-gray-500 mt-1 block">Próximamente</span>
            </button>
          </div>
        </div>
        
        {generalError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 text-sm font-medium">Error de registro</p>
              <p className="text-red-600 text-sm mt-1">{generalError}</p>
            </div>
          </div>
        )}

        <Input
          label="Nombre completo"
          name="nombre"
          type="text"
          value={data.nombre}
          onChange={handleNombreChange}
          error={getFieldError('nombre')}
          required
          disabled={isLoading}
          placeholder="Tu nombre completo"
          autoComplete="name"
        />

        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          value={data.email}
          onChange={handleEmailChange}
          error={getFieldError('email')}
          required
          disabled={isLoading}
          placeholder="tu@email.com"
          autoComplete="email"
        />

        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={data.password}
          onChange={handlePasswordChange}
          error={getFieldError('password')}
          required
          disabled={isLoading}
          placeholder="••••••••••••"
          autoComplete="new-password"
        />
        
        {/* Componente de requisitos de contraseña */}
        {PasswordRequirements}

        <Input
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          value={data.confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={getFieldError('confirmPassword')}
          required
          disabled={isLoading}
          placeholder="••••••••••••"
          autoComplete="new-password"
        />
        
        <Button 
          type="submit" 
          disabled={isLoading || !isFormValid}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creando cuenta...</span>
            </div>
          ) : (
            'Crear cuenta'
          )}
        </Button>

        <div className="my-4 flex items-center justify-center">
          <span className="text-gray-400 text-sm">o</span>
        </div>
        
        <Button
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:shadow-md hover:bg-gray-100 transition-all font-semibold py-2 rounded-lg mt-2"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{ boxShadow: '0 1px 2px rgba(60,64,67,.08)' }}
        >
          <span className="flex items-center justify-center bg-white rounded-full p-1 border border-gray-200 text-black">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
              <g clipPath="url(#clip0_760_7151)">
                <path d="M19.6 10.2273C19.6 9.5182 19.5364 8.8364 19.4182 8.1818H10V12.05H15.3818C15.15 13.3 14.4455 14.3591 13.3864 15.0682V17.5773H16.6182C18.5091 15.8364 19.6 13.2727 19.6 10.2273Z" fill="#4285F4"/>
                <path d="M10 20C12.7 20 14.9636 19.1045 16.6181 17.5773L13.3863 15.0682C12.4909 15.6682 11.3454 16.0227 10 16.0227C7.3954 16.0227 5.1909 14.2636 4.4045 11.9H1.0636V14.4909C2.7091 17.7591 6.0909 20 10 20Z" fill="#34A853"/>
                <path d="M4.4045 11.9C4.2045 11.3 4.0909 10.6591 4.0909 10C4.0909 9.3409 4.2045 8.7 4.4045 8.1V5.5091H1.0636C0.3864 6.8591 0 8.3864 0 10C0 11.6136 0.3864 13.1409 1.0636 14.4909L4.4045 11.9Z" fill="#FBBC04"/>
                <path d="M10 3.9773C11.4681 3.9773 12.7863 4.4818 13.8227 5.4727L16.6909 2.6045C14.9591 0.9909 12.6954 0 10 0C6.0909 0 2.7091 2.2409 1.0636 5.5091L4.4045 8.1C5.1909 5.7364 7.3954 3.9773 10 3.9773Z" fill="#E94235"/>
              </g>
              <defs>
                <clipPath id="clip0_760_7151">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </span>
          <span className='text-black'>Registrarse con Google</span>
        </Button>

        {/* Botón de login mejorado */}
        <div className="mt-6 text-center">
          <span className="text-gray-500 text-sm mr-2">¿Ya tienes cuenta?</span>
          <a
            href="/login"
            className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-[#8E94F2] to-[#7278e0] text-white font-semibold shadow-md hover:shadow-lg hover:from-[#7278e0] hover:to-[#8E94F2] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:ring-offset-2"
          >
            Inicia sesión
          </a>
        </div>
      </form>
    </div>
  )
} 