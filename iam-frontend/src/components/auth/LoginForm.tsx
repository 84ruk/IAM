'use client';

import { useState, useCallback } from 'react';
import { AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { AppError } from '@/lib/errorHandler';
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
  [key: string]: unknown;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const [data, setData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const updateField = (field: keyof FieldErrors, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  function isValidationAppError(error: unknown): error is { name: string; errors: { field: string; message: string }[] } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'ValidationAppError' &&
      Array.isArray((error as { errors?: unknown }).errors)
    );
  }

  const handleBackendError = useCallback((error: AppError) => {
    if (isValidationAppError(error)) {
      const errs = error.errors;
      const fieldErrors: FieldErrors = {};
      errs.forEach(e => {
        if (e.field === 'email' || e.field === 'password') {
          fieldErrors[e.field] = e.message;
        }
      });
      setValidationErrors(fieldErrors)
    } else {
      setGeneralError(error.message || 'Error inesperado al iniciar sesión')
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return

    // Validar campos
    const newValidationErrors: FieldErrors = {}
    
    if (!data.email) {
      newValidationErrors.email = 'El correo electrónico es requerido'
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newValidationErrors.email = 'El correo electrónico no es válido'
    }
    
    if (!data.password) {
      newValidationErrors.password = 'La contraseña es requerida'
    } else if (data.password.length < 6) {
      newValidationErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setValidationErrors(newValidationErrors)

    if (Object.keys(newValidationErrors).length > 0) {
      return
    }

    setIsLoading(true)
    setGeneralError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setShowSuccess(true)
        
        // ✅ NUEVO: Verificar si el usuario necesita configurar empresa
        try {
          const setupResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/needs-setup`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (setupResponse.ok) {
            const setupData = await setupResponse.json()
            
            // Redirigir según el estado de setup
            setTimeout(() => {
              if (setupData.needsSetup) {
                console.log('🔄 Login: Usuario necesita configurar empresa, redirigiendo a setup-empresa')
                window.location.href = '/setup-empresa'
              } else {
                console.log('🔄 Login: Usuario ya tiene empresa configurada, redirigiendo a dashboard')
                window.location.href = '/dashboard'
              }
            }, 1500)
          } else {
            // Si no se puede verificar setup, redirigir al dashboard por defecto
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 1500)
          }
        } catch (setupError) {
          console.error('Error verificando setup después del login:', setupError)
          // En caso de error, redirigir al dashboard por defecto
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1500)
        }
      } else {
        handleBackendError(result)
      }
    } catch {
      setGeneralError('Error de conexión. Verifica tu conexión a internet.')
    } finally {
      setIsLoading(false)
    }
  }, [data.email, data.password, isLoading, handleBackendError])

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
  }

  const getFieldError = (field: keyof FieldErrors) => {
    return validationErrors[field] || ''
  }

  if (isLoading && !showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">¡Inicio de sesión exitoso!</p>
          <p className="text-sm text-gray-500">Redirigiendo al dashboard...</p>
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
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Iniciar sesión</h1>
        
        {/* Mensaje de error general */}
        {generalError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 text-sm font-medium">Error de autenticación</p>
              <p className="text-red-600 text-sm mt-1">{generalError}</p>
            </div>
          </div>
        )}

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
          placeholder="••••••••"
          autoComplete="current-password"
        />
        
        <Button 
          type="submit" 
          disabled={isLoading || Object.keys(validationErrors).length > 0}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Iniciando sesión...</span>
            </div>
          ) : (
            'Iniciar sesión'
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
          <span className="flex items-center justify-center bg-white rounded-full p-1 border border-gray-200">
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
          <span>Iniciar sesión con Google</span>
        </Button>
        
        <div className="mt-4 text-center">
          <a 
            href="/forgot-password" 
            className="text-sm text-[#8E94F2] hover:text-[#7278e0] transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Botón de registro mejorado */}
        <div className="mt-6 text-center">
          <span className="text-gray-500 text-sm mr-2">¿No tienes cuenta?</span>
          <a
            href="/register"
            className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-[#8E94F2] to-[#7278e0] text-white font-semibold shadow-md hover:shadow-lg hover:from-[#7278e0] hover:to-[#8E94F2] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:ring-offset-2"
          >
            Regístrate
          </a>
        </div>
      </form>
    </div>
  );
}

