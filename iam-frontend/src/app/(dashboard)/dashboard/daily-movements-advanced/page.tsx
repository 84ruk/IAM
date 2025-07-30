'use client'

import { useState, useCallback } from 'react'
import { Suspense } from 'react'
import DailyMovementsChart from '@/components/dashboard/DailyMovementsChart'
import DailyMovementsTable from '@/components/dashboard/DailyMovementsTable'
import DailyMovementsFilters from '@/components/dashboard/DailyMovementsFilters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Activity, 
  BarChart3, 
  Table, 
  Filter, 
  Settings,
  Download,
  Share2,

  Maximize2,
  Minimize2
} from 'lucide-react'
import { DailyMovementsFilters as FiltersType } from '@/types/filters'

export default function DailyMovementsAdvancedPage() {
  const [currentFilters, setCurrentFilters] = useState<FiltersType>({
    period: '7d',
    chartType: 'combined',
    groupBy: 'day',
    sortBy: 'date',
    sortOrder: 'desc'
  } as FiltersType)
  
  const [showFilters, setShowFilters] = useState(true)
  const [showChart, setShowChart] = useState(true)
  const [showTable, setShowTable] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Manejar cambios de filtros
  const handleFiltersChange = useCallback((filters: FiltersType) => {
    setCurrentFilters(filters)
  }, [])

  // Exportar datos
  const handleExport = () => {
    // Implementar exportación con filtros aplicados
    console.log('Exportando con filtros:', currentFilters)
  }

  // Compartir configuración
  const handleShare = () => {
    const shareData = {
      filters: currentFilters,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
    
    const shareString = JSON.stringify(shareData, null, 2)
    navigator.clipboard.writeText(shareString)
    
    // Mostrar notificación
    alert('Configuración copiada al portapapeles')
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Movimientos de Inventario Diarios - Análisis Avanzado
            </h1>
            <p className="text-gray-600 mt-1">
              Análisis detallado con filtros avanzados y múltiples visualizaciones
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botón de filtros */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>

            {/* Botón de gráfica */}
            <Button
              variant={showChart ? "default" : "outline"}
              size="sm"
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Gráfica
            </Button>

            {/* Botón de tabla */}
            <Button
              variant={showTable ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTable(!showTable)}
            >
              <Table className="w-4 h-4 mr-2" />
              Tabla
            </Button>

            {/* Botón de pantalla completa */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>

            {/* Botón de exportar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>

            {/* Botón de compartir */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>

        {/* Resumen de filtros activos */}
        {Object.keys(currentFilters).length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuración Activa
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(currentFilters).map(([key, value]) => {
                if (value && value !== '') {
                  return (
                    <Badge key={key} variant="secondary" className="text-blue-700 bg-blue-100">
                      {key}: {Array.isArray(value) ? value.join(', ') : value.toString()}
                    </Badge>
                  )
                }
                return null
              })}
            </div>
          </div>
        )}

        {/* Filtros Avanzados */}
        {showFilters && (
          <div className="mb-8">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                    <span>Cargando filtros...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <DailyMovementsFilters
                onFiltersChange={handleFiltersChange}
                onReset={() => setCurrentFilters({
                  period: '7d',
                  chartType: 'combined',
                  groupBy: 'day',
                  sortBy: 'date',
                  sortOrder: 'desc'
                } as FiltersType)}
              />
            </Suspense>
          </div>
        )}

        {/* Gráfica de Movimientos */}
        {showChart && (
          <div className="mb-8">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                    <span>Cargando gráfica...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <DailyMovementsChart 
                initialDays={7}
                showControls={true}
                showSummary={true}
                chartType={currentFilters.chartType || 'combined'}
                height={400}
              />
            </Suspense>
          </div>
        )}

        {/* Tabla de Datos */}
        {showTable && (
          <div className="mb-8">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                    <span>Cargando tabla...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <DailyMovementsTable 
                initialDays={7}
                showSearch={true}
                showExport={true}
                maxRows={50}
              />
            </Suspense>
          </div>
        )}

        {/* Información Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5" />
                Características
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Filtros avanzados por producto y proveedor</li>
                <li>• Múltiples tipos de visualización</li>
                <li>• Exportación en múltiples formatos</li>
                <li>• Presets personalizables</li>
                <li>• Análisis de tendencias</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                Visualizaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Gráficas de líneas y barras</li>
                <li>• Gráficas de áreas apiladas</li>
                <li>• Gráficas combinadas</li>
                <li>• Tablas con ordenamiento</li>
                <li>• Resúmenes estadísticos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Períodos personalizables</li>
                <li>• Agrupación por múltiples criterios</li>
                <li>• Ordenamiento flexible</li>
                <li>• Filtros de valor y cantidad</li>
                <li>• Presets guardables</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Botón de salida de pantalla completa */}
        {isFullscreen && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              variant="default"
              size="lg"
              onClick={() => setIsFullscreen(false)}
              className="shadow-lg"
            >
              <Minimize2 className="w-5 h-5 mr-2" />
              Salir de Pantalla Completa
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 