'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { 
  Loader2, 
  AlertCircle, 
  BarChart3,
  TrendingUp
} from 'lucide-react'

interface TopProduct {
  nombre: string
  cantidad: number
  porcentaje: number
}

interface TopProductsListProps {
  title: string
  products: TopProduct[]
  isLoading?: boolean
  error?: any
  className?: string
}

export default function TopProductsList({
  title,
  products,
  isLoading = false,
  error = null,
  className = ''
}: TopProductsListProps) {
  const NoData = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">No hay datos disponibles</p>
      <p className="text-sm">Los datos aparecerán cuando tengas productos vendidos</p>
    </div>
  )

  const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center p-8 text-red-600">
      <AlertCircle className="w-12 h-12 mb-4" />
      <p className="text-lg font-medium">Error al cargar datos</p>
      <p className="text-sm text-center">{error?.message || 'Error desconocido'}</p>
    </div>
  )

  const LoadingDisplay = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      ))}
    </div>
  )

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const renderContent = () => {
    if (isLoading) return <LoadingDisplay />
    if (error) return <ErrorDisplay />
    if (!products || products.length === 0) return <NoData />

    return (
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{product.nombre}</p>
                <p className="text-sm text-gray-600">{product.cantidad} unidades vendidas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{product.cantidad}</p>
              <p className="text-sm text-gray-600">{formatPercentage(product.porcentaje)}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {renderContent()}
      </CardContent>
    </Card>
  )
} 