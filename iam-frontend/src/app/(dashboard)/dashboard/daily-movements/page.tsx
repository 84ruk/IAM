import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import DailyMovementsDashboard from '@/components/dashboard/DailyMovementsDashboard'

export default function DailyMovementsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Movimientos Diarios</h1>
          <p className="text-gray-600 mt-2">
            Análisis completo y detallado de los movimientos de inventario por día
          </p>
        </div>

        {/* Dashboard Principal */}
        <Suspense fallback={<CardSkeleton />}>
          <DailyMovementsDashboard />
        </Suspense>
      </div>
    </div>
  )
} 