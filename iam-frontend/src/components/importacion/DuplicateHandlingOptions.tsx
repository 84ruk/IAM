'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Checkbox'
import { Label } from '@/components/ui/Label'
import { 
  AlertTriangle, 
  Info, 
  Package, 
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface DuplicateHandlingOptionsProps {
  sobrescribirExistentes: boolean
  onSobrescribirChange: (value: boolean) => void
  duplicadosEncontrados?: number
  totalRegistros?: number
  onRetry?: () => void
  className?: string
}

export default function DuplicateHandlingOptions({
  sobrescribirExistentes,
  onSobrescribirChange,
  duplicadosEncontrados = 0,
  totalRegistros = 0,
  onRetry,
  className = ''
}: DuplicateHandlingOptionsProps) {
  const porcentajeDuplicados = totalRegistros > 0 ? (duplicadosEncontrados / totalRegistros) * 100 : 0

  return (
    <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <CardTitle className="text-yellow-800">Manejo de Duplicados</CardTitle>
          {duplicadosEncontrados > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800">
              {duplicadosEncontrados} duplicados
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estadísticas de duplicados */}
        {duplicadosEncontrados > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                <Package className="w-4 h-4" />
                <span className="text-xs font-medium">Duplicados</span>
              </div>
              <div className="text-lg font-bold text-yellow-800">
                {duplicadosEncontrados}
              </div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <Info className="w-4 h-4" />
                <span className="text-xs font-medium">Total</span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {totalRegistros}
              </div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Porcentaje</span>
              </div>
              <div className="text-lg font-bold text-yellow-800">
                {porcentajeDuplicados.toFixed(1)}%
              </div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Estado</span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {sobrescribirExistentes ? 'Sobrescribir' : 'Omitir'}
              </div>
            </div>
          </div>
        )}

        {/* Opción de sobrescribir */}
        <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-yellow-200">
          <Checkbox
            id="sobrescribir-existentes"
            checked={sobrescribirExistentes}
            onCheckedChange={(checked) => onSobrescribirChange(checked as boolean)}
            className="text-yellow-600"
          />
          <Label 
            htmlFor="sobrescribir-existentes" 
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Sobrescribir registros existentes
          </Label>
        </div>

        {/* Información adicional */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">¿Qué significa esto?</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Desactivado:</strong> Los duplicados se omitirán y no se procesarán</li>
                <li>• <strong>Activado:</strong> Los registros existentes se actualizarán con los nuevos datos</li>
                <li>• Los registros únicos siempre se procesarán normalmente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        {duplicadosEncontrados > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Recomendaciones:</p>
                <ul className="space-y-1 text-xs">
                  {porcentajeDuplicados > 50 && (
                    <li>• Muchos registros están duplicados. Considera revisar el archivo antes de importar.</li>
                  )}
                  {porcentajeDuplicados > 20 && porcentajeDuplicados <= 50 && (
                    <li>• Hay una cantidad moderada de duplicados. Verifica si es intencional.</li>
                  )}
                  <li>• Los duplicados se identifican por nombre, código de barras o SKU</li>
                  <li>• Puedes cambiar esta opción en cualquier momento antes de procesar</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-4 border-t border-yellow-200">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          )}
          
          <div className="text-xs text-gray-500">
            {duplicadosEncontrados > 0 
              ? `${duplicadosEncontrados} de ${totalRegistros} registros son duplicados`
              : 'No se encontraron duplicados'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 