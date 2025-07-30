'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Loader2,
  AlertCircle,
  BarChart3
} from 'lucide-react'

interface PredictionItem {
  producto: string
  diasRestantes?: number
  probabilidad?: number
  tendencia?: 'ascendente' | 'descendente' | 'estable'
  confianza?: number
}

interface PredictionsPanelProps {
  title: string
  predictions: PredictionItem[]
  type: 'quiebre' | 'tendencia'
  isLoading?: boolean
  error?: Error | null
  className?: string
}

export default function PredictionsPanel({
  title,
  predictions,
  type,
  isLoading = false,
  error = null,
  className = ''
}: PredictionsPanelProps) {
  const NoData = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">No hay predicciones disponibles</p>
      <p className="text-sm">Los datos aparecerán cuando tengas información registrada</p>
    </div>
  )

  const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center p-8 text-red-600">
      <AlertCircle className="w-12 h-12 mb-4" />
      <p className="text-lg font-medium">Error al cargar predicciones</p>
      <p className="text-sm text-center">{error?.message || 'Error desconocido'}</p>
    </div>
  )

  const LoadingDisplay = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
      <p className="text-lg font-medium text-gray-600">Cargando predicciones...</p>
    </div>
  )

  const getTrendIcon = (trend: 'ascendente' | 'descendente' | 'estable') => {
    switch (trend) {
      case 'ascendente':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'descendente':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const renderPredictionItem = (prediction: PredictionItem, index: number) => {
    if (type === 'quiebre') {
      return (
        <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">{prediction.producto}</p>
              <p className="text-sm text-gray-600">
                {prediction.diasRestantes} días restantes
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-red-600">
              {prediction.probabilidad ? formatPercentage(prediction.probabilidad) : 'Alto'} riesgo
            </p>
          </div>
        </div>
      )
    } else {
      return (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {prediction.tendencia && getTrendIcon(prediction.tendencia)}
            <div>
              <p className="font-medium text-gray-900">{prediction.producto}</p>
              <p className="text-sm text-gray-600">
                Tendencia {prediction.tendencia}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">
              {prediction.confianza ? formatPercentage(prediction.confianza) : 'N/A'} confianza
            </p>
          </div>
        </div>
      )
    }
  }

  const renderContent = () => {
    if (isLoading) return <LoadingDisplay />
    if (error) return <ErrorDisplay />
    if (!predictions || predictions.length === 0) {
      if (type === 'quiebre') {
        return (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">No hay productos en riesgo de quiebre de stock</p>
          </div>
        )
      }
      return <NoData />
    }

    return (
      <div className="space-y-3">
        {predictions.map((prediction, index) => renderPredictionItem(prediction, index))}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {renderContent()}
      </CardContent>
    </Card>
  )
} 