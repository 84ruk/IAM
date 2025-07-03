import React from 'react'
import { Tag } from 'lucide-react'
import EtiquetaTag from '@/components/ui/EtiquetaTag'

interface PopularTagsProps {
  etiquetasUnicas: string[]
  filtroEtiqueta: string
  onFiltrarPorEtiqueta: (etiqueta: string) => void
}

export default function PopularTags({
  etiquetasUnicas,
  filtroEtiqueta,
  onFiltrarPorEtiqueta
}: PopularTagsProps) {
  if (etiquetasUnicas.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Etiquetas:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {etiquetasUnicas.slice(0, 8).map(etiqueta => (
          <EtiquetaTag
            key={etiqueta}
            etiqueta={etiqueta}
            onClick={onFiltrarPorEtiqueta}
            isActive={filtroEtiqueta === etiqueta}
            size="md"
          />
        ))}
        {etiquetasUnicas.length > 8 && (
          <span className="text-xs text-gray-500 px-2 py-1">
            +{etiquetasUnicas.length - 8} más
          </span>
        )}
      </div>
    </div>
  )
} 