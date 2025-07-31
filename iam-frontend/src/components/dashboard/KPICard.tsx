'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'

import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
  subtitle?: string
  isLoading?: boolean
  error?: boolean
  className?: string
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  valueColor = 'text-gray-900',
  subtitle,
  isLoading = false,
  error = false,
  className = ''
}: KPICardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : error ? (
              <p className="text-2xl font-bold text-red-600">Error</p>
            ) : (
              <p className={`text-2xl font-bold ${valueColor}`}>
                {typeof value === 'number' && value >= 1000 
                  ? value.toLocaleString('es-ES') 
                  : value}
              </p>
            )}
            {subtitle && !isLoading && !error && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  )
} 