'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Activity, AlertTriangle, CheckCircle, Clock, RefreshCw, XCircle, Zap, Database, TrendingUp } from 'lucide-react'

interface DashboardRequestStats {
  total: number
  kpis: number
  financial: number
  industry: number
  predictive: number
  avgResponseTime: number
  lastRequestTime: number
  cacheHits: number
  cacheMisses: number
}

interface DashboardRequestOptimizerProps {
  className?: string
  onOptimize?: () => void
}

export default function DashboardRequestOptimizer({ className = '', onOptimize }: DashboardRequestOptimizerProps) {
  const [stats, setStats] = useState<DashboardRequestStats>({
    total: 0,
    kpis: 0,
    financial: 0,
    industry: 0,
    predictive: 0,
    avgResponseTime: 0,
    lastRequestTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  })
  
  const [isOptimizing, setIsOptimizing] = useState(false)
  const requestTimes = useRef<number[]>([])
  const activeRequests = useRef<Set<string>>(new Set())
  const cacheStats = useRef({ hits: 0, misses: 0 })

  // Monitorear requests del dashboard
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const startTime = Date.now()
      const requestId = `${Date.now()}-${Math.random()}`
      
      // Solo monitorear requests del dashboard
      const url = args[0]?.toString() || ''
      if (!url.includes('/dashboard-cqrs/') && !url.includes('/dashboard/')) {
        return originalFetch(...args)
      }

      activeRequests.current.add(requestId)
      updateStats()

      try {
        const response = await originalFetch(...args)
        const endTime = Date.now()
        const duration = endTime - startTime
        
        requestTimes.current.push(duration)
        if (requestTimes.current.length > 50) {
          requestTimes.current.shift()
        }
        
        activeRequests.current.delete(requestId)
        
        // Detectar cache hits/misses basado en headers
        const cacheHeader = response.headers.get('x-cache-status')
        if (cacheHeader === 'HIT') {
          cacheStats.current.hits++
        } else if (cacheHeader === 'MISS') {
          cacheStats.current.misses++
        }
        
        updateStats()
        
        return response
      } catch (error) {
        activeRequests.current.delete(requestId)
        updateStats()
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const updateStats = () => {
    const avgResponseTime = requestTimes.current.length > 0 
      ? requestTimes.current.reduce((a, b) => a + b, 0) / requestTimes.current.length 
      : 0

    // Contar requests por tipo
    const kpisCount = Array.from(activeRequests.current).filter(id => 
      id.includes('kpis') && !id.includes('financial') && !id.includes('industry') && !id.includes('predictive')
    ).length
    const financialCount = Array.from(activeRequests.current).filter(id => 
      id.includes('financial-kpis')
    ).length
    const industryCount = Array.from(activeRequests.current).filter(id => 
      id.includes('industry-kpis')
    ).length
    const predictiveCount = Array.from(activeRequests.current).filter(id => 
      id.includes('predictive-kpis')
    ).length

    setStats({
      total: requestTimes.current.length,
      kpis: kpisCount,
      financial: financialCount,
      industry: industryCount,
      predictive: predictiveCount,
      avgResponseTime,
      lastRequestTime: Date.now(),
      cacheHits: cacheStats.current.hits,
      cacheMisses: cacheStats.current.misses
    })
  }

  const handleOptimize = async () => {
    setIsOptimizing(true)
    
    // Simular optimización
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (onOptimize) {
      onOptimize()
    }
    
    setIsOptimizing(false)
  }

  const getPerformanceStatus = () => {
    if (stats.avgResponseTime > 3000) return 'critical'
    if (stats.avgResponseTime > 1500) return 'warning'
    if (stats.total > 20) return 'warning'
    return 'good'
  }

  const getCacheEfficiency = () => {
    const total = stats.cacheHits + stats.cacheMisses
    if (total === 0) return 0
    return Math.round((stats.cacheHits / total) * 100)
  }

  const performanceStatus = getPerformanceStatus()
  const cacheEfficiency = getCacheEfficiency()

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Optimizador Dashboard
          <Badge variant={performanceStatus === 'good' ? 'default' : performanceStatus === 'warning' ? 'secondary' : 'destructive'}>
            {performanceStatus === 'good' ? 'Óptimo' : performanceStatus === 'warning' ? 'Atención' : 'Crítico'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{cacheEfficiency}%</div>
            <div className="text-sm text-gray-600">Cache Hit Rate</div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tiempo promedio:</span>
            <span className="font-mono text-sm">
              {stats.avgResponseTime > 0 ? `${stats.avgResponseTime.toFixed(0)}ms` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Requests activos:</span>
            <span className="font-mono text-sm">{activeRequests.current.size}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Cache hits:</span>
            <span className="font-mono text-sm text-green-600">{stats.cacheHits}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Cache misses:</span>
            <span className="font-mono text-sm text-red-600">{stats.cacheMisses}</span>
          </div>
        </div>

        {performanceStatus !== 'good' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Optimización recomendada</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              {performanceStatus === 'critical' 
                ? 'Los tiempos de respuesta son muy altos. Considera usar el endpoint unificado.'
                : 'Hay muchos requests activos. Considera optimizar la carga de datos.'
              }
            </p>
          </div>
        )}

        <Button 
          onClick={handleOptimize} 
          disabled={isOptimizing}
          className="w-full"
          variant="outline"
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Optimizando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Optimizar Dashboard
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 