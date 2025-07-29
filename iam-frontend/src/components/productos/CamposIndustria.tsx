'use client'

import { useIndustriaConfig } from '@/hooks/useIndustriaConfig'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Thermometer, Droplets, MapPin, Tag, Package, Barcode, Radio } from 'lucide-react'

interface CamposIndustriaProps {
  camposRelevantes: string[]
  config: any
  formData: any
  updateField: (field: string, value: any) => void
  handleBlur: (field: string) => void
  errors: Record<string, string>
}

export default function CamposIndustria({ 
  camposRelevantes,
  config,
  formData,
  updateField,
  handleBlur,
  errors
}: CamposIndustriaProps) {
  const { config: industriaConfig, tipoIndustria } = useIndustriaConfig()
  const mostrarTemperaturaHumedad = industriaConfig.mostrarTemperaturaHumedad || false

  const renderCampo = (campo: string, label: string, type: string = 'text', icon?: React.ReactNode, optional = true) => {
    if (!camposRelevantes.includes(campo)) return null

    const error = errors[campo]
    
    // Obtener opciones específicas de la industria
    const getOpciones = () => {
      switch (campo) {
        case 'talla':
          return config.opciones?.tallas || ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        case 'color':
          return config.opciones?.colores || ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Gris', 'Marrón']
        default:
          return []
      }
    }
    
    return (
      <div key={campo} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label}
          {optional && <span className="text-gray-400">(opcional)</span>}
        </label>
        
        {type === 'select' ? (
          <Select
            options={getOpciones()}
            value={formData[campo] || ''}
            onChange={(e) => updateField(campo, e.target.value)}
            onBlur={() => handleBlur(campo)}
            error={error}
            optional={optional}
          />
        ) : (
          <Input
            name={campo}
            type={type}
            value={formData[campo] || ''}
            onChange={(e) => updateField(campo, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            onBlur={() => handleBlur(campo)}
            error={error}
            optional={optional}
            placeholder={`Ingresa ${label.toLowerCase()}`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Campos de Alimentos y Farmacia */}
      {mostrarTemperaturaHumedad && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderCampo('temperaturaOptima', 'Temperatura Óptima (°C)', 'number', <Thermometer className="w-4 h-4" />)}
          {renderCampo('humedadOptima', 'Humedad Óptima (%)', 'number', <Droplets className="w-4 h-4" />)}
        </div>
      )}

      {/* Campos de Ubicación */}
      {renderCampo('ubicacion', 'Ubicación en Almacén', 'text', <MapPin className="w-4 h-4" />)}

      {/* Campos de Ropa - Solo mostrar si la industria los incluye */}
      {(config.opciones?.tallas || config.opciones?.colores) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderCampo('talla', 'Talla', 'select', <Tag className="w-4 h-4" />)}
          {renderCampo('color', 'Color', 'select', <Tag className="w-4 h-4" />)}
        </div>
      )}

      {/* Campos Avanzados */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Campos Avanzados</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderCampo('sku', 'SKU', 'text', <Package className="w-4 h-4" />)}
          {renderCampo('codigoBarras', 'Código de Barras', 'text', <Barcode className="w-4 h-4" />)}
        </div>
        
        {renderCampo('rfid', 'RFID', 'text', <Radio className="w-4 h-4" />)}
      </div>
    </div>
  )
} 