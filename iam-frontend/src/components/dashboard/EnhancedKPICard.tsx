'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { LucideIcon, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface EnhancedKPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
  subtitle?: string
  isLoading?: boolean
  error?: boolean
  className?: string
  trend?: 'up' | 'down' | 'stable' | null
  trendValue?: string
  description?: string
  showInfo?: boolean
}

export default function EnhancedKPICard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  valueColor = 'text-gray-900',
  subtitle,
  isLoading = false,
  error = false,
  className = '',
  trend = null,
  trendValue,
  description,
  showInfo = false
}: EnhancedKPICardProps) {
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {showInfo && description && (
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-1 px-2 bottom-6 left-0 whitespace-nowrap">
                    {description}
                  </div>
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            ) : error ? (
              <div>
                <p className="text-2xl font-bold text-red-600">Error</p>
                <p className="text-sm text-red-500">Datos no disponibles</p>
              </div>
            ) : (
              <div>
                <p className={`text-2xl font-bold ${valueColor}`}>
                  {typeof value === 'number' && value >= 1000 
                    ? value.toLocaleString('es-ES') 
                    : value}
                </p>
                
                {/* Tendencia */}
                {trend && trendValue && (
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon()}
                    <span className={`text-sm font-medium ${getTrendColor()}`}>
                      {trendValue}
                    </span>
                  </div>
                )}
                
                {/* Subtitle */}
                {subtitle && !isLoading && !error && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="ml-4">
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
