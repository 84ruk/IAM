"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useFormValidation, validationPatterns } from '@/hooks/useFormValidation'
import { parseApiError, AppError, ValidationAppError, NetworkError } from '@/lib/errorHandler'
import { FcGoogle } from 'react-icons/fc'
import { PasswordStrength } from '@/components/ui/PasswordStrength'
import { EmailValidation } from '@/components/ui/EmailValidation'
import { PasswordConfirmation } from '@/components/ui/PasswordConfirmation'
import { CharacterValidation } from '@/components/ui/CharacterValidation'

interface RegisterFormData {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  [key: string]: unknown;
}

interface FieldErrors {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Configuración de validación
  const validationRules = {
    nombre: {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true,
      custom: (value: unknown) => {
        const stringValue = String(value)
        // Validar que solo contenga letras, espacios y caracteres acentuados
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(stringValue)) {
          return 'El nombre solo puede contener letras, espacios y acentos'
        }
        
        // Validar que no tenga espacios múltiples consecutivos
        if (/\s{2,}/.test(stringValue)) {
          return 'El nombre no puede tener espacios múltiples consecutivos'
        }
        
        // Validar que no empiece o termine con espacio
        if (stringValue.startsWith(' ') || stringValue.endsWith(' ')) {
          return 'El nombre no puede empezar o terminar con espacios'
        }
        
        // Validar que no tenga solo espacios
        if (/^\s+$/.test(stringValue)) {
          return 'El nombre no puede contener solo espacios'
        }
        
        return true
      }
    },
    email: {
      required: true,
      pattern: validationPatterns.email,
      sanitize: true,
      custom: (value: unknown) => {
        const stringValue = String(value)
        // Validar que no contenga caracteres especiales peligrosos
        if (/[<>\"'&]/.test(stringValue)) {
          return 'El email no puede contener caracteres especiales'
        }
        
        // Validar que no tenga espacios
        if (/\s/.test(stringValue)) {
          return 'El email no puede contener espacios'
        }
        
        return true
      }
    },
    password: {
      required: true,
      minLength: 12,
      maxLength: 128,
      sanitize: true,
      custom: (value: unknown) => {
        const stringValue = String(value)
        // Validar caracteres permitidos en contraseña
        if (!/^[a-zA-Z0-9@$!%*?&]+$/.test(stringValue)) {
          return 'La contraseña contiene caracteres no permitidos'
        }
        
        if (!/(?=.*[a-z])/.test(stringValue)) {
          return 'La contraseña debe contener al menos una letra minúscula'
        }
        if (!/(?=.*[A-Z])/.test(stringValue)) {
          return 'La contraseña debe contener al menos una letra mayúscula'
        }
        if (!/(?=.*\d)/.test(stringValue)) {
          return 'La contraseña debe contener al menos un número'
        }
        
        // Validar símbolos
        if (!/(?=.*[@$!%*?&])/.test(stringValue)) {
          return 'La contraseña debe contener al menos un símbolo (@$!%*?&)'
        }
        
        // Validar que no tenga espacios
        if (/\s/.test(stringValue)) {
          return 'La contraseña no puede contener espacios'
        }
        
        return true
      }
    },
    confirmPassword: {
      required: true,
      sanitize: true,
      custom: (value: unknown) => {
        const stringValue = String(value)
        if (stringValue !== data.password) {
          return 'Las contraseñas no coinciden'
        }
        return true
      }
    }
  }

  const {
    data,
    errors: validationErrors,
    updateField,
    validateForm,
    clearErrors,
  } = useFormValidation<RegisterFormData>(
    { nombre: '', email: '', password: '', confirmPassword: '' },
    validationRules
  )

  // Validación personalizada para confirmar contraseña
  const validateConfirmPassword = () => {
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      return 'Las contraseñas no coinciden'
    }
    return null
  }

  // Limpiar errores cuando cambian los campos
  useEffect(() => {
    if (generalError) {
      setTimeout(() => setGeneralError(''), 5000)
    }
  }, [generalError, fieldErrors])

  // Función para manejar errores específicos del backend
  const handleBackendError = (error: AppError) => {
    if (error instanceof ValidationAppError && error.errors) {
      // Error de validación con errores específicos por campo
      const newFieldErrors: FieldErrors = {}
      error.errors.forEach(err => {
        if (['nombre', 'email', 'password', 'confirmPassword'].includes(err.field)) {
          // Mejorar mensajes de error específicos
          let improvedMessage = err.message;
          
          // Errores específicos de caracteres especiales
          if (err.message.includes('caracteres especiales') || err.message.includes('invalid characters')) {
            if (err.field === 'nombre') {
              improvedMessage = 'El nombre contiene caracteres no permitidos. Solo se permiten letras, espacios y acentos.';
            } else if (err.field === 'email') {
              improvedMessage = 'El email contiene caracteres no permitidos.';
            } else if (err.field === 'password') {
              improvedMessage = 'La contraseña contiene caracteres no permitidos.';
            }
          }
          
          // Errores de espacios
          if (err.message.includes('espacios') || err.message.includes('spaces')) {
            improvedMessage = 'Este campo no puede contener espacios.';
          }
          
          // Errores de longitud
          if (err.message.includes('longitud') || err.message.includes('length')) {
            if (err.field === 'nombre') {
              improvedMessage = 'El nombre debe tener entre 2 y 100 caracteres.';
            } else if (err.field === 'password') {
              improvedMessage = 'La contraseña debe tener entre 6 y 128 caracteres.';
            }
          }
          
          newFieldErrors[err.field as keyof FieldErrors] = improvedMessage;
        }
      })
      setFieldErrors(newFieldErrors)
      setGeneralError('')
    } else if (error.statusCode === 409) {
      // Usuario ya existe
      setGeneralError('Ya existe una cuenta con este correo electrónico')
      setFieldErrors({})
    } else if (error.statusCode === 400) {
      // Error de validación general
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('caracteres especiales') || errorMessage.includes('invalid characters')) {
        setGeneralError('Los datos contienen caracteres no permitidos. Revisa los campos marcados.')
      } else if (errorMessage.includes('espacios') || errorMessage.includes('spaces')) {
        setGeneralError('Algunos campos contienen espacios no permitidos.')
      } else {
        setGeneralError(error.message || 'Error de validación. Revisa los campos marcados.')
      }
      setFieldErrors({})
    } else if (error instanceof NetworkError) {
      // Error de red
      setGeneralError('Error de conexión. Verifica tu conexión a internet')
      setFieldErrors({})
    } else if (error.statusCode >= 500) {
      // Error del servidor
      setGeneralError('Error del servidor. Intenta nuevamente más tarde')
      setFieldErrors({})
    } else {
      // Error genérico
      setGeneralError(error.message || 'Error inesperado. Intenta nuevamente')
      setFieldErrors({})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setGeneralError('')
    setFieldErrors({})
    clearErrors()

    // Validar confirmación de contraseña
    const confirmPasswordError = validateConfirmPassword()
    if (confirmPasswordError) {
      setFieldErrors({ confirmPassword: confirmPasswordError })
      return
    }

    // Validar formulario en frontend
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const parsedError = parseApiError(res, errorData)
        handleBackendError(parsedError)
        return
      }

      // Registro exitoso
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err: unknown) {
      console.error('Error en registro:', err)
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setGeneralError(err.message)
      } else {
        setGeneralError('Error inesperado al registrar usuario')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleRegister = () => {
    setGeneralError('')
    setFieldErrors({})
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
  }

  // Determinar errores finales combinando validación frontend y errores del backend
  const getFieldError = (field: keyof FieldErrors) => {
    return fieldErrors[field] || validationErrors[field] || ''
  }

  if (isSubmitting && !showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Creando tu cuenta...</p>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="text-center">
          <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">¡Cuenta creada exitosamente!</p>
          <p className="text-sm text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
        <p className="text-gray-600 mb-6">Regístrate para comenzar a usar el sistema.</p>
        
        {/* Mensaje informativo */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-700 text-sm font-medium">¿Ya tienes cuenta?</p>
            <p className="text-blue-600 text-sm mt-1">
              <a href="/login" className="underline hover:text-blue-800">Inicia sesión aquí</a>
            </p>
          </div>
        </div>

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

        <Button
          type="button"
          onClick={handleGoogleRegister}
          className="w-full flex items-center justify-center gap-2 mb-6 border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
          variant="outline"
          disabled={isSubmitting}
        >
          <FcGoogle className="w-5 h-5" />
          Registrarse con Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">o regístrate con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Input
              label="Nombre completo"
              name="nombre"
              value={data.nombre}
              onChange={e => updateField('nombre', e.target.value)}
              placeholder="Tu nombre completo"
              disabled={isSubmitting}
              error={getFieldError('nombre')}
              required
              autoComplete="name"
            />
            <CharacterValidation 
              field="nombre" 
              value={data.nombre} 
              showRules={data.nombre.length > 0} 
            />
          </div>
          
          <div>
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              value={data.email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              disabled={isSubmitting}
              error={getFieldError('email')}
              required
              autoComplete="email"
            />
            <EmailValidation email={data.email} />
            <CharacterValidation 
              field="email" 
              value={data.email} 
              showRules={data.email.length > 0} 
            />
          </div>
          
          <div>
            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={data.password}
              onChange={e => updateField('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={isSubmitting}
              error={getFieldError('password')}
              required
              autoComplete="new-password"
            />
            <PasswordStrength password={data.password} />
            <CharacterValidation 
              field="password" 
              value={data.password} 
              showRules={data.password.length > 0} 
            />
          </div>
          
          <div>
            <Input
              label="Confirmar contraseña"
              name="confirmPassword"
              type="password"
              value={data.confirmPassword}
              onChange={e => updateField('confirmPassword', e.target.value)}
              placeholder="Repite tu contraseña"
              disabled={isSubmitting}
              error={getFieldError('confirmPassword')}
              required
              autoComplete="new-password"
            />
            <PasswordConfirmation password={data.password} confirmPassword={data.confirmPassword} />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando cuenta...</span>
              </div>
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
} 