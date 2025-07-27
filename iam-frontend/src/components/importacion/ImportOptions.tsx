'use client'

import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Settings,
  AlertTriangle,
  Mail,
  RefreshCw,
  Info
} from 'lucide-react'

interface ImportOptionsProps {
  opciones: {
    sobrescribirExistentes: boolean
    validarSolo: boolean
    notificarEmail: boolean
    emailNotificacion: string
  }
  onOpcionesChange: (opciones: any) => void
}

export default function ImportOptions({ opciones, onOpcionesChange }: ImportOptionsProps) {
  const handleChange = (field: string, value: any) => {
    onOpcionesChange({
      ...opciones,
      [field]: value
    })
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900">Opciones de importación</h4>
          </div>

          {/* Opciones principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sobrescribir existentes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sobrescribirExistentes"
                  checked={opciones.sobrescribirExistentes}
                  onCheckedChange={(checked) => 
                    handleChange('sobrescribirExistentes', checked)
                  }
                />
                <Label htmlFor="sobrescribirExistentes" className="text-sm font-medium">
                  Sobrescribir registros existentes
                </Label>
              </div>
              <p className="text-xs text-gray-600 ml-6">
                Si está habilitado, los registros existentes serán actualizados con los nuevos datos
              </p>
            </div>

            {/* Validar solo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="validarSolo"
                  checked={opciones.validarSolo}
                  onCheckedChange={(checked) => 
                    handleChange('validarSolo', checked)
                  }
                />
                <Label htmlFor="validarSolo" className="text-sm font-medium">
                  Solo validar sin importar
                </Label>
              </div>
              <p className="text-xs text-gray-600 ml-6">
                Revisa el archivo en busca de errores sin realizar la importación
              </p>
            </div>
          </div>

          {/* Notificaciones por email */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="notificarEmail"
                checked={opciones.notificarEmail}
                onCheckedChange={(checked) => 
                  handleChange('notificarEmail', checked)
                }
              />
              <Label htmlFor="notificarEmail" className="text-sm font-medium">
                Recibir notificación por email
              </Label>
            </div>
            
            {opciones.notificarEmail && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="emailNotificacion" className="text-sm text-gray-700">
                  Email para notificación
                </Label>
                <Input
                  id="emailNotificacion"
                  type="email"
                  placeholder="tu@email.com"
                  value={opciones.emailNotificacion}
                  onChange={(e) => handleChange('emailNotificacion', e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-600">
                  Recibirás un email cuando la importación se complete
                </p>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Consejos para una importación exitosa:</p>
                <ul className="space-y-1">
                  <li>• Asegúrate de que el archivo tenga las columnas requeridas</li>
                  <li>• Verifica que los datos estén en el formato correcto</li>
                  <li>• Para archivos grandes, considera usar la validación previa</li>
                  <li>• Los archivos Numbers se procesan automáticamente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Advertencias */}
          {opciones.sobrescribirExistentes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium">Advertencia:</p>
                  <p>Al habilitar "Sobrescribir existentes", los registros actuales serán reemplazados. Esta acción no se puede deshacer.</p>
                </div>
              </div>
            </div>
          )}

          {opciones.validarSolo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-800">
                  <p className="font-medium">Modo validación:</p>
                  <p>El archivo será validado sin realizar cambios en la base de datos. Revisa el reporte de errores antes de importar.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 