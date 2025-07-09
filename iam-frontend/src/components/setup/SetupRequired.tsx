'use client'

import { Building, Settings, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useSetup } from '@/context/SetupContext'

interface SetupRequiredProps {
  title?: string
  description?: string
  showActionButton?: boolean
  className?: string
}

export default function SetupRequired({
  title = "Configuración requerida",
  description = "Necesitas configurar tu empresa para acceder a esta funcionalidad.",
  showActionButton = true,
  className = ""
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

      {showActionButton && (
        <Button
          onClick={redirectToSetup}
          className="flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Configurar Empresa</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
} 