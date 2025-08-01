'use client'

import { Building, Settings, ArrowRight, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useSetup } from '@/context/SetupContext'

interface SetupRequiredProps {
  title?: string
  description?: string
  showActionButton?: boolean
  className?: string
  showInfo?: boolean
}

export default function SetupRequired({
  title = "Configuración requerida",
  description = "Necesitas configurar tu empresa para acceder a esta funcionalidad.",
  showActionButton = true,
  className = "",
  showInfo = true
}: SetupRequiredProps) {
  const { redirectToSetup } = useSetup()

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="bg-blue-50 rounded-full p-4 mb-4">
        <Building className="w-8 h-8 text-blue-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {description}
      </p>

      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">¿Por qué necesito configurar mi empresa?</p>
              <p className="text-sm text-blue-700">
                La configuración de empresa es necesaria para personalizar tu experiencia y 
                acceder a todas las funcionalidades del sistema de inventario.
              </p>
            </div>
          </div>
        </div>
      )}

      {showActionButton && (
        <Button
          onClick={redirectToSetup}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Settings className="w-4 h-4" />
          <span>Configurar Empresa</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
} 