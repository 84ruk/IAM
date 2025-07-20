'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { 
  Search, 
  Download, 
  RefreshCw, 
  Package, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calendar,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { useDailyMovements } from '@/hooks/useDailyMovements'
import { DailyMovementsResponse } from '@/types/kpis'

interface DailyMovementsTableProps {
  className?: string
  initialDays?: number
  showSearch?: boolean
  showExport?: boolean
  maxRows?: number
}

type SortField = 'fecha' | 'entradas' | 'salidas' | 'neto' | 'valorEntradas' | 'valorSalidas' | 'valorNeto'
type SortDirection = 'asc' | 'desc'

export default function DailyMovementsTable({
  className = '',
  initialDays = 7,
  showSearch = true,
  showExport = true,
  maxRows = 50
}: DailyMovementsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const { data, isLoading, error, refetch } = useDailyMovements({
    days: initialDays,
    autoRefresh: false
  })

  // Procesar y filtrar datos
  const processedData = useMemo(() => {
    if (!data?.data) return []

    let filtered = data.data

    // Aplicar búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        format(new Date(item.fecha), 'dd/MM/yyyy').includes(term) ||
        item.entradas.toString().includes(term) ||
        item.salidas.toString().includes(term) ||
        item.neto.toString().includes(term)
      )
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Convertir fechas para comparación
      if (sortField === 'fecha') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    console.log('filtered', filtered)
    console.log('data', data)
    // Limitar filas
    return filtered.slice(0, maxRows)
  }, [data?.data, searchTerm, sortField, sortDirection, maxRows])

  // Manejar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Formatear valor monetario
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value)
  }

  // Formatear número
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-MX').format(value)
  }

  // Obtener color para valores netos
  const getNetColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  // Exportar datos
  const exportData = () => {
    if (!processedData.length) return

    const headers = ['Fecha', 'Entradas', 'Salidas', 'Neto', 'Valor Entradas', 'Valor Salidas', 'Valor Neto']
    const csvContent = [
      headers.join(','),
      ...processedData.map(row => [
        format(new Date(row.fecha), 'dd/MM/yyyy'),
        row.entradas,
        row.salidas,
        row.neto,
        row.valorEntradas,
        row.valorSalidas,
        row.valorNeto
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

  // Renderizar encabezado de tabla con ordenamiento
  const renderSortableHeader = (field: SortField, label: string) => (
    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )
        ) : (
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </TableHead>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Tabla de Movimientos Diarios
        </CardTitle>
        {data?.meta && (
          <p className="text-sm text-gray-500">
            Mostrando {processedData.length} de {data.meta.totalDays} días
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por fecha, entradas, salidas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {showExport && (
            <Button
              variant="outline"
              onClick={exportData}
              disabled={!processedData.length}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Actualizar
          </Button>
        </div>

        {/* Tabla */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Cargando datos...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">Error al cargar datos</p>
              <p className="text-sm text-gray-500 mt-1">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          )}
          
          {!isLoading && !error && processedData.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">
                {searchTerm ? 'No se encontraron resultados' : 'No hay datos disponibles'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Los movimientos aparecerán cuando registres entradas o salidas de inventario'}
              </p>
            </div>
          )}
          
          {!isLoading && !error && processedData.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {renderSortableHeader('fecha', 'Fecha')}
                    {renderSortableHeader('entradas', 'Entradas')}
                    {renderSortableHeader('salidas', 'Salidas')}
                    {renderSortableHeader('neto', 'Neto')}
                    {renderSortableHeader('valorEntradas', 'Valor Entradas')}
                    {renderSortableHeader('valorSalidas', 'Valor Salidas')}
                    {renderSortableHeader('valorNeto', 'Valor Neto')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {format(new Date(row.fecha), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {formatNumber(row.entradas)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {formatNumber(row.salidas)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getNetColor(row.neto)}`}>
                          {row.neto > 0 ? '+' : ''}{formatNumber(row.neto)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-medium">
                            {formatCurrency(row.valorEntradas)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-red-600" />
                          <span className="text-red-600 font-medium">
                            {formatCurrency(row.valorSalidas)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className={`w-3 h-3 ${getNetColor(row.valorNeto)}`} />
                          <span className={`font-medium ${getNetColor(row.valorNeto)}`}>
                            {row.valorNeto > 0 ? '+' : ''}{formatCurrency(row.valorNeto)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Resumen */}
        {data?.summary && processedData.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Resumen del Período</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Promedio Entradas:</p>
                <p className="font-medium text-green-600">{data.summary.avgEntradasDiarias.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-gray-600">Promedio Salidas:</p>
                <p className="font-medium text-red-600">{data.summary.avgSalidasDiarias.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Movimientos:</p>
                <p className="font-medium text-blue-600">{data.summary.totalMovimientos}</p>
              </div>
              <div>
                <p className="text-gray-600">Tendencia:</p>
                <Badge className="mt-1">
                  {data.summary.tendencia}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 