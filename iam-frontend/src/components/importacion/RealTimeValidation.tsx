'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Brain,
  Target,
  TrendingUp,
  Clock,
  FileText,
  Database,
  Shield,
  Sparkles,
  Settings
} from 'lucide-react'
import { useImportacionWebSocket } from '@/hooks/useImportacionWebSocket'

interface ValidationRule {
  id: string
  name: string
  description: string
  type: 'format' | 'range' | 'required' | 'unique' | 'reference' | 'custom'
  severity: 'error' | 'warning' | 'info'
  applied: boolean
  successRate: number
}

interface ValidationResult {
  id: string
  ruleId: string
  row: number
  column: string
  value: any
  message: string
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
  autoFix?: boolean
  timestamp: Date
}

interface RealTimeValidationProps {
  trabajoId?: string
  isActive?: boolean
  onValidationComplete?: (results: ValidationResult[]) => void
}

export default function RealTimeValidation({ 
  trabajoId, 
  isActive = false,
  onValidationComplete 
}: RealTimeValidationProps) {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([])
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [autoFixEnabled, setAutoFixEnabled] = useState(true)
  const [validationProgress, setValidationProgress] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    autoFixed: 0
  })

  const { isConnected } = useImportacionWebSocket()

  // Generar reglas de validación de ejemplo
  useEffect(() => {
    const generateValidationRules = () => {
      const rules: ValidationRule[] = [
        {
          id: '1',
          name: 'Formato de Email',
          description: 'Validar formato correcto de email',
          type: 'format',
          severity: 'error',
          applied: true,
          successRate: 95
        },
        {
          id: '2',
          name: 'Rango de Precios',
          description: 'Precios entre 0 y 1,000,000',
          type: 'range',
          severity: 'warning',
          applied: true,
          successRate: 88
        },
        {
          id: '3',
          name: 'Campos Requeridos',
          description: 'Verificar campos obligatorios',
          type: 'required',
          severity: 'error',
          applied: true,
          successRate: 92
        },
        {
          id: '4',
          name: 'Unicidad de Códigos',
          description: 'Códigos de producto únicos',
          type: 'unique',
          severity: 'error',
          applied: true,
          successRate: 97
        },
        {
          id: '5',
          name: 'Referencias Válidas',
          description: 'Verificar existencia de referencias',
          type: 'reference',
          severity: 'warning',
          applied: false,
          successRate: 85
        },
        {
          id: '6',
          name: 'Validación Inteligente',
          description: 'IA para detectar patrones anómalos',
          type: 'custom',
          severity: 'info',
          applied: true,
          successRate: 78
        }
      ]
      setValidationRules(rules)
    }

    generateValidationRules()
  }, [])

  // Simular validación en tiempo real
  useEffect(() => {
    if (!isActive || !trabajoId) return

    const simulateValidation = async () => {
      setIsValidating(true)
      setValidationProgress(0)

      // Simular progreso de validación
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setValidationProgress(i)

        // Generar resultados de validación simulados
        if (i % 20 === 0) {
          const newResults: ValidationResult[] = [
            {
              id: `result-${i}-1`,
              ruleId: '1',
              row: Math.floor(Math.random() * 100) + 1,
              column: 'email',
              value: 'invalid-email',
              message: 'Formato de email inválido',
              severity: 'error',
              suggestion: 'Usar formato: usuario@dominio.com',
              autoFix: false,
              timestamp: new Date()
            },
            {
              id: `result-${i}-2`,
              ruleId: '2',
              row: Math.floor(Math.random() * 100) + 1,
              column: 'precio',
              value: -50,
              message: 'Precio fuera del rango válido',
              severity: 'warning',
              suggestion: 'El precio debe ser mayor a 0',
              autoFix: true,
              timestamp: new Date()
            }
          ]

          setValidationResults(prev => [...prev, ...newResults])
        }
      }

      setIsValidating(false)
      
      // Calcular estadísticas finales
      const finalResults = validationResults
      const stats = {
        total: finalResults.length,
        errors: finalResults.filter(r => r.severity === 'error').length,
        warnings: finalResults.filter(r => r.severity === 'warning').length,
        info: finalResults.filter(r => r.severity === 'info').length,
        autoFixed: finalResults.filter(r => r.autoFix).length
      }
      setStats(stats)

      if (onValidationComplete) {
        onValidationComplete(finalResults)
      }
    }

    simulateValidation()
  }, [isActive, trabajoId, onValidationComplete])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'info': return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const handleAutoFix = useCallback((resultId: string) => {
    setValidationResults(prev => 
      prev.map(result => 
        result.id === resultId 
          ? { ...result, autoFix: true, message: `${result.message} (Auto-corregido)` }
          : result
      )
    )
  }, [])

  const filteredResults = validationResults.filter(result => {
    if (!showDetails && result.severity === 'info') return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Validación en Tiempo Real</h3>
          {isValidating && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Validando...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? 'Ocultar' : 'Mostrar'} detalles
          </button>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-gray-600">
          {isConnected ? 'Conectado para validación en tiempo real' : 'Desconectado'}
        </span>
      </div>

      {/* Progreso de validación */}
      {isValidating && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso de validación</span>
                <span>{validationProgress}%</span>
              </div>
              <Progress value={validationProgress} className="w-full" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Brain className="w-3 h-3" />
                <span>Aplicando reglas inteligentes...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <div className="text-xs text-gray-600">Errores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <div className="text-xs text-gray-600">Advertencias</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
            <div className="text-xs text-gray-600">Info</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.autoFixed}</div>
            <div className="text-xs text-gray-600">Auto-corregidos</div>
          </CardContent>
        </Card>
      </div>

      {/* Reglas de validación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Reglas de Validación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{rule.name}</span>
                    <Badge 
                      variant={rule.applied ? 'default' : 'secondary'}
                      className={rule.applied ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {rule.applied ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{rule.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-gray-500">{rule.successRate}% éxito</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados de validación */}
      {filteredResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resultados de Validación ({filteredResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredResults.map((result) => (
                <div key={result.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1 rounded ${getSeverityColor(result.severity)}`}>
                    {getSeverityIcon(result.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Fila {result.row}, {result.column}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.value}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                    {result.suggestion && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 {result.suggestion}
                      </p>
                    )}
                    {result.autoFix && (
                      <div className="flex items-center gap-2 mt-2">
                        <Sparkles className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">Auto-corregido</span>
                      </div>
                    )}
                  </div>
                  {!result.autoFix && result.severity !== 'error' && (
                    <button
                      onClick={() => handleAutoFix(result.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      title="Auto-corregir"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-corrección</p>
                <p className="text-xs text-gray-600">Corregir automáticamente errores menores</p>
              </div>
              <input
                type="checkbox"
                checked={autoFixEnabled}
                onChange={(e) => setAutoFixEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Validación inteligente</p>
                <p className="text-xs text-gray-600">Usar IA para detectar patrones anómalos</p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Activa
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 