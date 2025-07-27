'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Package,
  ShoppingCart,
  Activity,
  FileText,
  CheckCircle
} from 'lucide-react'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import { getImportacionConfig } from '@/config/importacion.config'

interface ImportTypeSelectorProps {
  onSelect: (tipo: TipoImportacion) => void
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    description: 'Importa tu catálogo de productos desde Excel, Numbers o CSV',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    features: ['Nombre y descripción', 'Stock y precios', 'Categorías y etiquetas', 'Información de proveedores']
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Importa tu lista de proveedores desde Excel, Numbers o CSV',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800',
    features: ['Datos de contacto', 'Información fiscal', 'Dirección y teléfono', 'Persona de contacto']
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Importa movimientos de inventario desde Excel, Numbers o CSV',
    icon: Activity,
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800',
    features: ['Entradas y salidas', 'Fechas y cantidades', 'Motivos y observaciones', 'Referencias de productos']
  },
  auto: {
    title: 'Importación Automática',
    description: 'Detecta automáticamente el tipo de datos desde Excel, Numbers o CSV',
    icon: FileText,
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-800',
    features: ['Detección automática', 'Validación inteligente', 'Múltiples formatos', 'Procesamiento optimizado']
  }
}

export default function ImportTypeSelector({ onSelect }: ImportTypeSelectorProps) {
  return (
    <div className="space-y-4">
      {(Object.keys(tipoConfig) as TipoImportacion[]).map((tipo) => {
        const config = tipoConfig[tipo]
        const IconComponent = config.icon
        
        return (
          <div 
            key={tipo}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-1 cursor-pointer border-0"
            onClick={() => onSelect(tipo)}
          >
            {/* Fondo con gradiente sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-6">
                {/* Icono y contenido principal */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex-shrink-0">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                        {config.title}
                      </h3>
                      <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        {tipo}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {config.description}
                    </p>
                    
                    {/* Características en línea */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Características:</span>
                      </div>
                      <div className="flex gap-4">
                        {config.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formatos soportados y acción */}
                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700 block mb-2">Formatos soportados:</span>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">Excel</span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">Numbers</span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">CSV</span>
                    </div>
                  </div>
                  
                  {/* Indicador de selección */}
                  <div className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-blue-500 group-hover:bg-blue-500 transition-all duration-300 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 