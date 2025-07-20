import { Suspense } from 'react'
import DailyMovementsChart from '@/components/dashboard/DailyMovementsChart'
import DailyMovementsTable from '@/components/dashboard/DailyMovementsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Activity, BarChart3, Table, Info } from 'lucide-react'

export default function DailyMovementsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Movimientos de Inventario Diarios
        </h1>
        <p className="text-gray-600">
          Análisis detallado de entradas y salidas de inventario por día
        </p>
      </div>

      {/* Información */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Información del KPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Qué mide?</h4>
              <p className="text-sm text-gray-600">
                Cantidad y valor de productos que entran y salen del inventario cada día, 
                permitiendo identificar patrones de actividad y tendencias.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Cuándo se actualiza?</h4>
              <p className="text-sm text-gray-600">
                Automáticamente cada vez que registras una entrada o salida de inventario. 
                Los datos se actualizan en tiempo real con cache de 5 minutos.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">¿Cómo interpretarlo?</h4>
              <p className="text-sm text-gray-600">
                Valores positivos en "Neto" indican crecimiento del inventario. 
                La tendencia muestra si la actividad está aumentando, disminuyendo o estable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfica Principal */}
      <div className="mb-8">
        <Suspense fallback={
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Cargando gráfica...</span>
              </div>
            </CardContent>
          </Card>
        }>
          <DailyMovementsChart 
            initialDays={7}
            showControls={true}
            showSummary={true}
            chartType="combined"
            height={400}
          />
        </Suspense>
      </div>

      {/* Gráficas Especializadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Cargando...</span>
              </div>
            </CardContent>
          </Card>
        }>
          <DailyMovementsChart 
            initialDays={15}
            showControls={true}
            showSummary={false}
            chartType="line"
            height={300}
          />
        </Suspense>

        <Suspense fallback={
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Cargando...</span>
              </div>
            </CardContent>
          </Card>
        }>
          <DailyMovementsChart 
            initialDays={30}
            showControls={true}
            showSummary={false}
            chartType="bar"
            height={300}
          />
        </Suspense>
      </div>

      {/* Tabla de Datos */}
      <div className="mb-8">
        <Suspense fallback={
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Cargando tabla...</span>
              </div>
            </CardContent>
          </Card>
        }>
          <DailyMovementsTable 
            initialDays={7}
            showSearch={true}
            showExport={true}
            maxRows={20}
          />
        </Suspense>
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gráfica de Líneas</p>
                <p className="text-2xl font-bold text-blue-600">7 días</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gráfica de Barras</p>
                <p className="text-2xl font-bold text-green-600">15 días</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gráfica de Áreas</p>
                <p className="text-2xl font-bold text-purple-600">30 días</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tabla de Datos</p>
                <p className="text-2xl font-bold text-orange-600">20 filas</p>
              </div>
              <Table className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 