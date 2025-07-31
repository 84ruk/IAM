'use client'

import { memo, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Componente de carga optimizado
const RechartsSkeleton = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Componentes individuales para compatibilidad
export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const Line = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Line })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const XAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.XAxis })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const YAxis = dynamic(
  () => import('recharts').then(mod => ({ default: mod.YAxis })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const Tooltip = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Tooltip })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const Pie = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Pie })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const Cell = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Cell })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const Bar = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Bar })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const CartesianGrid = dynamic(
  () => import('recharts').then(mod => ({ default: mod.CartesianGrid })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const Area = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Area })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const AreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

export const ComposedChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ComposedChart })),
  { 
    ssr: false,
    loading: RechartsSkeleton
  }
)

// ✅ CORREGIDO: Wrapper optimizado con memoización - exportado como named export
interface RechartsWrapperProps {
  children: React.ReactNode
  className?: string
}

export const RechartsWrapper = memo(function RechartsWrapper({ children, className = '' }: RechartsWrapperProps) {
  return (
    <Suspense fallback={<RechartsSkeleton />}>
      <div className={className}>
        {children}
      </div>
    </Suspense>
  )
})

RechartsWrapper.displayName = 'RechartsWrapper'

// ✅ NUEVO: Export default para compatibilidad
export default RechartsWrapper 