'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Componente de carga
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Importaciones dinámicas con tipos correctos
export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const Line = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Line })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const XAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.XAxis })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const YAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.YAxis })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const Tooltip = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Tooltip })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const Pie = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Pie })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const Cell = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Cell })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const Bar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Bar })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const CartesianGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const Area = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Area })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const AreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

export const ComposedChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ComposedChart })),
  { 
    ssr: false,
    loading: LoadingSpinner
  }
)

// Wrapper principal para componentes que necesitan hidratación
interface RechartsWrapperProps {
  children: React.ReactNode
  className?: string
}

export default function RechartsWrapper({ children, className = '' }: RechartsWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <LoadingSpinner />
  }

  return <div className={className}>{children}</div>
} 