'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Minus,
  SortAsc,
  SortDesc,
  RefreshCw,
  Activity,
  EyeOff,
  Download,
  Filter,
  DollarSign
} from 'lucide-react'
import { formatCurrency } from '@/lib/kpi-utils'
import { useDailyMovements } from '@/hooks/useDailyMovements'

interface DailyMovementsTableProps {
  initialDays?: number
  showSearch?: boolean
  showExport?: boolean
  maxRows?: number
  className?: string
}

type SortField = 'fecha' | 'entradas' | 'salidas' | 'neto' | 'valorEntradas' | 'valorSalidas' | 'valorNeto'
type SortDirection = 'asc' | 'desc'

export default function DailyMovementsTable({
  initialDays = 7,
  showSearch = true,
  showExport = true,
  maxRows = 20,
  className = ''
}: DailyMovementsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showDetails, setShowDetails] = useState(false)

  const { data, isLoading, error, refetch } = useDailyMovements({
    days: initialDays,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000
  })

  // Procesar y filtrar datos
  const processedData = useMemo(() => {
    if (!data?.data) return []

    let processed = data.data.map(item => ({
      ...item,
      fecha: format(new Date(item.fecha), 'dd/MM/yyyy'),
      fechaOriginal: item.fecha,
      totalMovimientos: (item.entradas || 0) + (item.salidas || 0),
      margen: item.margenPromedio !== undefined ? item.margenPromedio : (item.valorEntradas > 0 ? ((item.valorNeto / item.valorEntradas) * 100) : 0),
      tendencia: item.neto > 0 ? 'CRECIENTE' : item.neto < 0 ? 'DECRECIENTE' : 'ESTABLE'
    }))

    // Filtrar por término de búsqueda
    if (searchTerm) {
      processed = processed.filter(item => 
        item.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tendencia.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenar datos
    processed.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Manejar fechas
      if (sortField === 'fecha') {
        aValue = new Date(a.fechaOriginal).getTime()
        bValue = new Date(b.fechaOriginal).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Limitar filas
    return processed.slice(0, maxRows)
  }, [data, searchTerm, sortField, sortDirection, maxRows])

  // Función para cambiar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Función para exportar datos
  const handleExport = () => {
    if (!processedData.length) return

    const headers = ['Fecha', 'Entradas', 'Salidas', 'Neto', 'Valor Entradas', 'Valor Salidas', 'Valor Neto', 'Margen', 'Tendencia']
    const csvContent = [
      headers.join(','),
      ...processedData.map(item => [
        item.fecha,
        item.entradas,
        item.salidas,
        item.neto,
        item.valorEntradas,
        item.valorSalidas,
        item.valorNeto,
        `${item.margen.toFixed(2)}%`,
        item.tendencia
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `movimientos-diarios-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Obtener color de tendencia
  const getTendencyColor = (tendencia: string) => {
    switch (tendencia) {
      case 'CRECIENTE': return 'text-green-600 bg-green-100'
      case 'DECRECIENTE': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  // Obtener icono de tendencia
  const getTendencyIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'CRECIENTE': return <TrendingUp className="w-4 h-4" />
      case 'DECRECIENTE': return <TrendingDown className="w-4 h-4" />
      default: return <Minus className="w-4 h-4" />
    }
  }

  // Obtener icono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar datos</div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Tabla de Movimientos Diarios
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
            >
              {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showDetails ? 'Ocultar Detalles' : 'Mostrar Detalles'}
            </Button>

            {showExport && (
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Controles de búsqueda y filtros */}
        {showSearch && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por fecha o tendencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{processedData.length} de {data?.data?.length || 0} registros</span>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('fecha')}
                >
                  <div className="flex items-center gap-1">
                    Fecha
                    {getSortIcon('fecha')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('entradas')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Entradas
                    {getSortIcon('entradas')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('salidas')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Salidas
                    {getSortIcon('salidas')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('neto')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Neto
                    {getSortIcon('neto')}
                  </div>
                </th>
                {showDetails && (
                  <>
                    <th 
                      className="text-right py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('valorEntradas')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-4 h-4" />
                        Valor Entradas
                        {getSortIcon('valorEntradas')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('valorSalidas')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-4 h-4" />
                        Valor Salidas
                        {getSortIcon('valorSalidas')}
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('valorNeto')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-4 h-4" />
                        Valor Neto
                        {getSortIcon('valorNeto')}
                      </div>
                    </th>
                  </>
                )}
                <th className="text-center py-3 px-4 font-medium text-gray-900">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={showDetails ? 8 : 5} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td colSpan={showDetails ? 8 : 5} className="text-center py-8 text-gray-500">
                    No se encontraron datos
                  </td>
                </tr>
              ) : (
                processedData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.fecha}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {item.entradas.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-medium">
                      {item.salidas.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className={item.neto >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.neto >= 0 ? '+' : ''}{item.neto.toLocaleString()}
                      </span>
                    </td>
                    {showDetails && (
                      <>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatCurrency(item.valorEntradas)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatCurrency(item.valorSalidas)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          <span className={item.valorNeto >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.valorNeto >= 0 ? '+' : ''}{formatCurrency(item.valorNeto)}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-center">
                      <Badge className={getTendencyColor(item.tendencia)}>
                        {getTendencyIcon(item.tendencia)}
                        {item.tendencia}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        {processedData.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total Entradas:</span>
                <span className="ml-2 text-green-600 font-semibold">
                  {processedData.reduce((sum, item) => sum + item.entradas, 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Salidas:</span>
                <span className="ml-2 text-red-600 font-semibold">
                  {processedData.reduce((sum, item) => sum + item.salidas, 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Neto Total:</span>
                <span className="ml-2 font-semibold">
                  {processedData.reduce((sum, item) => sum + item.neto, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 