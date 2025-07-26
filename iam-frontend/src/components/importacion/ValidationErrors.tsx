'use client'

import React, { useMemo } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, FileText, XCircle } from 'lucide-react'

// Tipos reutilizables
export interface ValidationError {
  fila: number
  columna: string
  valor: string
  mensaje: string
  tipo: string
}

interface ValidationErrorsProps {
  errors: ValidationError[]
  totalRegistros: number
  className?: string
}

// Componente reutilizable para mostrar un error individual
const ErrorItem: React.FC<{ error: ValidationError; index: number }> = React.memo(({ error, index }) => (
  <div className="flex items-start gap-2 text-sm">
    <span className="text-destructive">•</span>
    <div className="flex-1">
      <span className="font-medium">{error.columna}:</span>{' '}
      <span className="text-muted-foreground">
        "{error.valor || '(vacío)'}"
      </span>
      <br />
      <span className="text-destructive">{error.mensaje}</span>
    </div>
  </div>
))

// Componente reutilizable para mostrar errores de una fila
const RowErrors: React.FC<{ fila: number; errors: ValidationError[] }> = React.memo(({ fila, errors }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">Fila {fila}</span>
      <Badge variant="outline">{errors.length} errores</Badge>
    </div>
    
    <div className="ml-6 space-y-1">
      {errors.map((error, index) => (
        <ErrorItem key={index} error={error} index={index} />
      ))}
    </div>
  </div>
))

// Componente reutilizable para las guías de corrección
const CorrectionGuide: React.FC = React.memo(() => (
  <div className="mt-4 p-4 bg-muted rounded-lg">
    <h4 className="font-medium mb-2">¿Cómo corregir estos errores?</h4>
    <ul className="text-sm space-y-1 text-muted-foreground">
      <li>• <strong>Campos requeridos:</strong> Asegúrate de que nombre, stock, precioCompra y precioVenta no estén vacíos</li>
      <li>• <strong>Valores numéricos:</strong> Stock y precios deben ser números positivos</li>
      <li>• <strong>Tipo de producto:</strong> Debe ser: GENERICO, MEDICAMENTO, ALIMENTO, ROPA, ELECTRONICO</li>
      <li>• <strong>Unidad:</strong> Debe ser: UNIDAD, KILO, KILOGRAMO, LITRO, LITROS, CAJA, PAQUETE, METRO, METROS, GRAMO, GRAMOS, MILILITRO, MILILITROS, CENTIMETRO, CENTIMETROS</li>
      <li>• <strong>Longitud:</strong> Los nombres deben tener entre 2 y 100 caracteres</li>
    </ul>
  </div>
))

export const ValidationErrors: React.FC<ValidationErrorsProps> = React.memo(({ 
  errors, 
  totalRegistros, 
  className 
}) => {
  // Memoizar el agrupamiento de errores por fila
  const errorsByRow = useMemo(() => {
    return errors.reduce((acc, error) => {
      if (!acc[error.fila]) {
        acc[error.fila] = []
      }
      acc[error.fila].push(error)
      return acc
    }, {} as Record<number, ValidationError[]>)
  }, [errors])

  // Memoizar estadísticas
  const stats = useMemo(() => ({
    totalErrors: errors.length,
    totalRows: Object.keys(errorsByRow).length
  }), [errors.length, errorsByRow])

  return (
    <Card className={`w-full ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          Errores de Validación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Archivo con errores</AlertTitle>
          <AlertDescription>
            Se encontraron <strong>{stats.totalErrors} errores</strong> en <strong>{stats.totalRows} filas</strong> de un total de <strong>{totalRegistros} registros</strong>.
            Corrige los errores y vuelve a intentar la importación.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Errores por fila:</h4>
            <Badge variant="destructive">{stats.totalRows} filas con errores</Badge>
          </div>

          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {Object.entries(errorsByRow).map(([fila, rowErrors]) => (
                <RowErrors key={fila} fila={parseInt(fila)} errors={rowErrors} />
              ))}
            </div>
          </ScrollArea>
        </div>

        <CorrectionGuide />
      </CardContent>
    </Card>
  )
})

ValidationErrors.displayName = 'ValidationErrors' 