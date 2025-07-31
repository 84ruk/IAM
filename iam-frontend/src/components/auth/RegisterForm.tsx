'use client'

import { useState, useCallback } from 'react'
import { AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
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

  const updateField = (field: keyof FieldErrors, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  function isValidationAppError(error: unknown): error is { name: string; errors: { field: string; message: string }[] } {
    return typeof error === 'object' && error !== null && (error as Record<string, unknown>).name === 'ValidationAppError' && 'errors' in error
  }

  const validateForm = useCallback((): boolean => {
    const errors: FieldErrors = {}

    // Validar nombre
    if (!data.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
    } else if (data.nombre.length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres'
    } else if (data.nombre.length > 50) {
      errors.nombre = 'El nombre no puede exceder 50 caracteres'
    } else if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/.test(data.nombre)) {
      errors.nombre = 'El nombre contiene caracteres no permitidos'
    }

    // Validar email
    if (!data.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'El email no es válido'
    }

    // Validar contraseña
    if (!data.password) {
      errors.password = 'La contraseña es requerida'
    } else if (data.password.length < 12) {
      errors.password = 'La contraseña debe tener al menos 12 caracteres'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(data.password)) {
      errors.password = 'La contraseña debe contener mayúsculas, minúsculas, números y símbolos (@$!%*?&)'
    }

    // Validar confirmación de contraseña
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña'
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [data.nombre, data.email, data.password, data.confirmPassword])

  const handleBackendError = useCallback((result: unknown) => {
    if (isValidationAppError(result)) {
      const fieldErrors: FieldErrors = {}
      result.errors.forEach(error => {
        fieldErrors[error.field as keyof FieldErrors] = error.message
      })
      setValidationErrors(fieldErrors)
    } else if (result instanceof AppError) {
      setGeneralError(result.message)
    } else {
      setGeneralError('Error inesperado durante el registro')
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return

    // Validar formulario
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
        setShowSuccess(true)
        // Redirigir después de un breve delay
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        handleBackendError(result)
      }
    } catch {
      setGeneralError('Error de conexión. Verifica tu conexión a internet.')
    } finally {
      setIsLoading(false)
    }
  }, [data.nombre, data.email, data.password, isLoading, handleBackendError, validateForm])

  const getFieldError = (field: keyof FieldErrors) => {
    return validationErrors[field] || ''
  }

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
          <p className="text-sm text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      {/* Botón para regresar al landing page */}
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
        
        {/* Mensaje de error general */}
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
          onChange={e => updateField('nombre', e.target.value)}
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
          onChange={e => updateField('email', e.target.value)}
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
          onChange={e => updateField('password', e.target.value)}
          error={getFieldError('password')}
          required
          disabled={isLoading}
          placeholder="••••••••••••"
          autoComplete="new-password"
        />

        <Input
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          value={data.confirmPassword}
          onChange={e => updateField('confirmPassword', e.target.value)}
          error={getFieldError('confirmPassword')}
          required
          disabled={isLoading}
          placeholder="••••••••••••"
          autoComplete="new-password"
        />
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>

        {/* Enlace para ir al login */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
} 