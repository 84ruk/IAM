'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useFormValidation, validationPatterns } from '@/hooks/useFormValidation';
import { parseApiError, AppError, ValidationAppError, AuthError, NetworkError } from '@/lib/errorHandler';
import { useBackendError } from '@/hooks/useBackendError'
import { BackendErrorHandler } from '@/components/ui/BackendErrorHandler'

interface LoginFormData {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const { error, isRetrying, handleError, clearError, retryOperation } = useBackendError()
  
  // Configuración de validación
  const validationRules = {
    email: {
      required: true,
      pattern: validationPatterns.email,
      sanitize: true,
    },
    password: {
      required: true,
      minLength: 1, // Mínimo 1 carácter (no mostrar longitud específica por seguridad)
      sanitize: true,
    },
  };

  const {
    data,
    errors: validationErrors,
    updateField,
    validateForm,
    clearErrors,
  } = useFormValidation<LoginFormData>(
    { email: '', password: '' },
    validationRules
  );

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
      const newFieldErrors: FieldErrors = {};
      error.errors.forEach(err => {
        if (err.field === 'email' || err.field === 'password') {
          newFieldErrors[err.field as keyof FieldErrors] = err.message;
        }
      });
      setFieldErrors(newFieldErrors);
      setGeneralError('');
    } else if (error instanceof AuthError) {
      // Error de credenciales
      setGeneralError('Correo electrónico o contraseña incorrectos');
      setFieldErrors({});
    } else if (error.statusCode === 404) {
      // Usuario no encontrado
      setGeneralError('Usuario no encontrado');
      setFieldErrors({});
    } else if (error.statusCode === 400 && error.message.includes('rol')) {
      // Error de rol
      setGeneralError('Tu cuenta no tiene los permisos necesarios');
      setFieldErrors({});
    } else if (error.message.includes('Google') || error.message.includes('OAuth')) {
      // Error específico de Google
      setGeneralError('Error al conectar con Google. Intenta nuevamente');
      setFieldErrors({});
    } else if (error instanceof NetworkError) {
      // Error de red
      setGeneralError('Error de conexión. Verifica tu conexión a internet');
      setFieldErrors({});
    } else if (error.statusCode >= 500) {
      // Error del servidor
      setGeneralError('Error del servidor. Intenta nuevamente más tarde');
      setFieldErrors({});
    } else {
      // Error genérico
      setGeneralError(error.message || 'Error inesperado. Intenta nuevamente');
      setFieldErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setGeneralError('');
    setFieldErrors({});
    clearErrors();

    // Validar formulario en frontend
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: data.email.trim(), 
          password: data.password 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const parsedError = parseApiError(res, errorData);
        handleBackendError(parsedError);
        return;
      }

      // Login exitoso - verificar si necesita setup
      setShowSuccess(true);
      
      // Verificar si necesita setup después del login
      try {
        const setupCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/needs-setup`, {
          credentials: 'include',
        });
        
        if (setupCheckResponse.ok) {
          const setupData = await setupCheckResponse.json();
          
          if (setupData.needsSetup) {
            // Si necesita setup, redirigir a la página de setup
            setTimeout(() => {
              router.push('/setup-empresa');
            }, 1000);
          } else {
            // Si no necesita setup, ir al dashboard
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          }
        } else {
          // Si hay error en la verificación, ir al dashboard por defecto
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }
      } catch (error) {
        console.error('Error verificando setup:', error);
        // En caso de error, ir al dashboard por defecto
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }

    } catch (err: unknown) {
      console.error('Error en login:', err)
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setGeneralError(err.message)
      } else {
        setGeneralError('Error inesperado al iniciar sesión')
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGeneralError('');
    setFieldErrors({});
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  // Determinar errores finales combinando validación frontend y errores del backend
  const getFieldError = (field: keyof FieldErrors) => {
    return fieldErrors[field] || validationErrors[field] || '';
  };

  // Determinar si el campo tiene error
  const hasFieldError = (field: keyof FieldErrors) => {
    return !!(fieldErrors[field] || validationErrors[field]);
  };

  const handleRetry = useCallback(() => {
    // Reintentar la operación de login
    if (data.email && data.password) {
      handleSubmit(new Event('submit') as React.FormEvent)
    }
  }, [data.email, data.password, handleSubmit])

  const handleFieldError = (field: string, error: unknown) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: typeof error === 'string' ? error : 'Error de validación'
    }))
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
    <BackendErrorHandler
      error={error}
      isRetrying={isRetrying}
      onRetry={handleRetry}
      onClear={clearError}
    >
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
    </BackendErrorHandler>
  );
}

