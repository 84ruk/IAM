'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { format } from 'date-fns'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from '@/components/ui/RechartsWrapper'
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react'


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B']

interface KPIGraphProps {
  data: Record<string, unknown>[]
  title: string
  type: 'line' | 'bar' | 'area' | 'pie'
  height?: number
  className?: string
  error?: Error | null
  isLoading?: boolean
  xAxisDataKey?: string
  dataKey?: string
  formatLabel?: (value: unknown) => string
  formatValue?: (value: number) => string
}

export function KPIGraph({ 
  data, 
  title, 
  type, 
  height = 300, 
  className, 
  error, 
  isLoading,
  xAxisDataKey = 'fecha',
  dataKey = 'valor',
  formatLabel,
  formatValue
}: KPIGraphProps) {
  const NoData = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">No hay datos disponibles</p>
      <p className="text-sm">Los datos aparecerán cuando tengas información registrada</p>
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
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
      <p className="text-lg font-medium text-gray-600">Cargando datos...</p>
    </div>
  )

  const renderChart = () => {
    if (isLoading) return <LoadingDisplay />
    if (error) return <ErrorDisplay />
    if (!data || data.length === 0) return <NoData />

    const commonProps = {
      data,
      width: '100%',
      height,
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisDataKey} 
                tickFormatter={(value) => {
                  if (formatLabel) return formatLabel(value)
                  try {
                    return format(new Date(value), 'dd/MM')
                  } catch {
                    return value
                  }
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: unknown) => [
                  formatValue ? formatValue(Number(value)) : String(value), 
                  dataKey
                ]}
                labelFormatter={(label) => {
                  if (formatLabel) return formatLabel(label)
                  try {
                    return format(new Date(String(label)), 'dd/MM/yyyy')
                  } catch {
                    return String(label)
                  }
                }}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="#0088FE" 
                strokeWidth={2}
                dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisDataKey}
                tickFormatter={(value) => {
                  if (formatLabel) return formatLabel(value)
                  return value
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: unknown) => [
                  formatValue ? formatValue(Number(value)) : String(value), 
                  dataKey
                ]}
              />
              <Bar dataKey={dataKey} fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ [xAxisDataKey]: label, [dataKey]: value }) => 
                  `${label}: ${formatValue ? formatValue(value) : value}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: unknown) => [
                  formatValue ? formatValue(Number(value)) : String(value), 
                  dataKey
                ]} 
              />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <NoData />
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {renderChart()}
      </CardContent>
    </Card>
  )
} 