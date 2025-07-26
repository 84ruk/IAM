'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/Badge'
import { 
  Apple,
  CheckCircle
} from 'lucide-react'

interface NumbersFileNotificationProps {
  fileName: string
  className?: string
}

export const NumbersFileNotification: React.FC<NumbersFileNotificationProps> = ({ 
  fileName, 
  className = '' 
}) => {
  return (
    <Alert variant="info" className={className}>
      <Apple className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            Archivo Numbers detectado
          </Badge>
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        <p className="text-sm">
          <strong>{fileName}</strong> es un archivo de Apple Numbers (Mac). 
          El sistema lo procesará automáticamente como un archivo Excel.
        </p>
        <p className="text-xs mt-1 opacity-80">
          💡 Los archivos .numbers son compatibles al 100% con el sistema de importación.
        </p>
      </AlertDescription>
    </Alert>
  )
}

export default NumbersFileNotification 