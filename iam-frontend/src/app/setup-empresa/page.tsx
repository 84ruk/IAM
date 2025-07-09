'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { apiClient } from '@/lib/api'
import { INDUSTRIAS, TipoIndustria } from '@/config/industrias.config'
import { Building, MapPin, Phone, FileText, CheckCircle, ArrowRight, ArrowLeft, LogOut, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ContextualMessage from '@/components/ui/ContextualMessage'
import { Card } from '@/components/ui/Card'
import StepTransition from '@/components/ui/StepTransition'
import ProgressSteps from '@/components/ui/ProgressSteps'

// Schema de validación
const setupEmpresaSchema = z.object({
  nombreEmpresa: z.string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .max(100, 'El nombre de la empresa no puede exceder 100 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]+$/, 'El nombre contiene caracteres no permitidos'),
  tipoIndustria: z.enum(['ALIMENTOS', 'ROPA', 'ELECTRONICA', 'GENERICA', 'FARMACIA'] as const),
  rfc: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional()
})

type SetupEmpresaForm = z.infer<typeof setupEmpresaSchema>

const STEPS = [
  {
    id: 1,
    title: 'Información Básica',
    description: 'Datos principales de tu empresa',
    icon: Building
  },
  {
    id: 2,
    title: 'Tipo de Industria',
    description: 'Selecciona el sector de tu negocio',
    icon: FileText
  },
  {
    id: 3,
    title: 'Información Adicional',
    description: 'Datos opcionales de contacto',
    icon: MapPin
  },
  {
    id: 4,
    title: 'Confirmación',
    description: 'Revisa y confirma la configuración',
    icon: CheckCircle
  }
]

export default function SetupEmpresaPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<SetupEmpresaForm>({
    nombreEmpresa: '',
    tipoIndustria: 'GENERICA',
    rfc: '',
    direccion: '',
    telefono: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Función de logout
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Redirigir de todas formas
      router.push('/login');
    }
  };

  const handleInputChange = (field: keyof SetupEmpresaForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    setApiError(null)
  }

  const validateStep = (step: number): boolean => {
    try {
      switch (step) {
        case 1:
          if (!formData.nombreEmpresa.trim()) {
            setErrors({ nombreEmpresa: 'El nombre de la empresa es obligatorio' })
            return false
          }
          break
        case 2:
          if (!formData.tipoIndustria) {
            setErrors({ tipoIndustria: 'Debes seleccionar un tipo de industria' })
            return false
          }
          break
        case 3:
          // Paso opcional, siempre válido
          break
      }
      setErrors({})
      return true
    } catch (error) {
      return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/setup-empresa`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al configurar empresa')
      }

      const result = await res.json()
      
      // Verificar que se recibió el nuevo token
      if (result.token) {
        // Actualizar la cookie manualmente
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieDomain = process.env.COOKIE_DOMAIN || (isProduction ? '.iaminventario.com.mx' : 'localhost');
        
        // Configurar la cookie con las opciones correctas
        let cookieString = `jwt=${result.token}; path=/; max-age=86400`;
        
        if (isProduction) {
          cookieString += `; domain=${cookieDomain}; secure; samesite=none`;
        } else {
          cookieString += `; domain=${cookieDomain}`;
        }
        
        document.cookie = cookieString;
      }

      // Verificar que el setup fue exitoso
      if (result.message && result.empresa) {
        console.log('✅ Empresa configurada exitosamente:', result.empresa.nombre)
        setShowSuccess(true)
        
        // Redirigir después de mostrar el éxito
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        router.push('/dashboard')
      }
      
    } catch (error: any) {
      console.error('Error configurando empresa:', error)
      setApiError(error?.message || 'Error al configurar empresa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¿Cuál es el nombre de tu empresa?
              </h2>
              <p className="text-gray-600">
                Este será el nombre que aparecerá en tu dashboard y reportes
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la empresa *
              </label>
              <Input
                type="text"
                value={formData.nombreEmpresa}
                onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                placeholder="Ej: Mi Restaurante S.A. de C.V."
                className={errors.nombreEmpresa ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.nombreEmpresa && (
                <p className="mt-1 text-sm text-red-600">{errors.nombreEmpresa}</p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¿En qué industria trabajas?
              </h2>
              <p className="text-gray-600">
                Esto nos ayudará a personalizar tu experiencia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(INDUSTRIAS).map(([key, config]) => (
                <Card
                  key={key}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.tipoIndustria === key
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                      : 'hover:shadow-md hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('tipoIndustria', key)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.tipoIndustria === key
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.tipoIndustria === key && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{config.label}</h3>
                      <p className="text-sm text-gray-500">
                        {config.camposRelevantes.length} campos especializados
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Información adicional (opcional)
              </h2>
              <p className="text-gray-600">
                Estos datos nos ayudarán a mejorar tu experiencia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC
                </label>
                <Input
                  type="text"
                  value={formData.rfc || ''}
                  onChange={(e) => handleInputChange('rfc', e.target.value)}
                  placeholder="RFC de la empresa"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <Input
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="Teléfono de contacto"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <Input
                type="text"
                value={formData.direccion || ''}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Dirección de la empresa"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Confirma tu configuración
              </h2>
              <p className="text-gray-600">
                Revisa los datos antes de continuar
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Nombre de la empresa:</span>
                  <span className="text-gray-900">{formData.nombreEmpresa}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Tipo de industria:</span>
                  <span className="text-gray-900">{INDUSTRIAS[formData.tipoIndustria].label}</span>
                </div>
                {formData.rfc && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">RFC:</span>
                    <span className="text-gray-900">{formData.rfc}</span>
                  </div>
                )}
                {formData.telefono && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Teléfono:</span>
                    <span className="text-gray-900">{formData.telefono}</span>
                  </div>
                )}
                {formData.direccion && (
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-gray-700">Dirección:</span>
                    <span className="text-gray-900">{formData.direccion}</span>
                  </div>
                )}
              </div>
            </Card>

            {apiError && (
              <ContextualMessage type="warning" title="Error al configurar empresa">
                {apiError}
              </ContextualMessage>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (isSubmitting && !showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Configurando tu empresa...</p>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="text-center">
          <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">¡Empresa configurada exitosamente!</p>
          <p className="text-sm text-gray-500">Redirigiendo al dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con botón de logout */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Configura tu empresa
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Completa estos pasos para comenzar a usar el sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800 hover:bg-gray-50 whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
          <span className="sm:hidden">Salir</span>
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto mb-8">
        <ProgressSteps currentStep={currentStep} steps={STEPS} />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <StepTransition step={currentStep}>
            {renderStepContent()}
          </StepTransition>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </Button>

          <div className="text-sm text-gray-500">
            Paso {currentStep} de {STEPS.length}
          </div>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Configurando...</span>
                </>
              ) : (
                <>
                  <span>Configurar Empresa</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 