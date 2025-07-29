'use client'

import { useIndustriaConfig } from '@/hooks/useIndustriaConfig'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Thermometer, Droplets, Tag, Package } from 'lucide-react'

interface FiltrosIndustriaProps {
  filtros: {
    temperaturaMin?: string
    temperaturaMax?: string
    humedadMin?: string
    humedadMax?: string
    talla?: string
    color?: string
    sku?: string
    codigoBarras?: string
  }
  onFiltroChange: (campo: string, valor: string) => void
}

export default function FiltrosIndustria({ filtros, onFiltroChange }: FiltrosIndustriaProps) {
  const { config, tipoIndustria } = useIndustriaConfig()
  const mostrarTemperaturaHumedad = config.mostrarTemperaturaHumedad || false

  const renderFiltrosTemperaturaHumedad = () => {
    if (!mostrarTemperaturaHumedad) return null

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Thermometer className="w-4 h-4" />
          Filtros de Temperatura y Humedad
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Temperatura Mín (°C)</label>
            <Input
              type="number"
              value={filtros.temperaturaMin || ''}
              onChange={(e) => onFiltroChange('temperaturaMin', e.target.value)}
              placeholder="0"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Temperatura Máx (°C)</label>
            <Input
              type="number"
              value={filtros.temperaturaMax || ''}
              onChange={(e) => onFiltroChange('temperaturaMax', e.target.value)}
              placeholder="50"
              className="text-sm"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Humedad Mín (%)</label>
            <Input
              type="number"
              value={filtros.humedadMin || ''}
              onChange={(e) => onFiltroChange('humedadMin', e.target.value)}
              placeholder="0"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Humedad Máx (%)</label>
            <Input
              type="number"
              value={filtros.humedadMax || ''}
              onChange={(e) => onFiltroChange('humedadMax', e.target.value)}
              placeholder="100"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderFiltrosRopa = () => {
    if (tipoIndustria !== 'ROPA') return null

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Filtros de Ropa
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Talla</label>
            <Select
              value={filtros.talla || ''}
              onChange={(e) => onFiltroChange('talla', e.target.value)}
              className="text-sm"
            >
              <option value="">Todas las tallas</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Color</label>
            <Select
              value={filtros.color || ''}
              onChange={(e) => onFiltroChange('color', e.target.value)}
              className="text-sm"
            >
              <option value="">Todos los colores</option>
              <option value="Negro">Negro</option>
              <option value="Blanco">Blanco</option>
              <option value="Rojo">Rojo</option>
              <option value="Azul">Azul</option>
              <option value="Verde">Verde</option>
              <option value="Amarillo">Amarillo</option>
              <option value="Gris">Gris</option>
              <option value="Marrón">Marrón</option>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  const renderFiltrosElectronica = () => {
    if (tipoIndustria !== 'ELECTRONICA') return null

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Filtros de Electrónica
        </h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">SKU</label>
            <Input
              type="text"
              value={filtros.sku || ''}
              onChange={(e) => onFiltroChange('sku', e.target.value)}
              placeholder="Buscar por SKU"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Código de Barras</label>
            <Input
              type="text"
              value={filtros.codigoBarras || ''}
              onChange={(e) => onFiltroChange('codigoBarras', e.target.value)}
              placeholder="Buscar por código de barras"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderFiltrosTemperaturaHumedad()}
      {renderFiltrosRopa()}
      {renderFiltrosElectronica()}
    </div>
  )
} 