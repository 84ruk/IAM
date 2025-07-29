'use client'

import useSWR from 'swr'
import { KPIData, FinancialKPIs, IndustryKPIs, PredictiveKPIs } from '@/types/kpis'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    return res.json()
  })

// Hook para KPIs básicos
export function useKPIs(period: string = 'mes') {
  return useSWR<KPIData>(
    `/dashboard-cqrs/kpis?period=${period}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutos
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
}

// Hook para KPIs financieros
export function useFinancialKPIs(period: string = 'mes') {
  return useSWR<FinancialKPIs>(
    `/dashboard-cqrs/financial-kpis?period=${period}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
}

// Hook para KPIs de industria
export function useIndustryKPIs(industry: string = 'general') {
  return useSWR<IndustryKPIs>(
    `/dashboard-cqrs/industry-kpis?industry=${industry}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
}

// Hook para KPIs predictivos
export function usePredictiveKPIs(days: number = 30) {
  return useSWR<PredictiveKPIs>(
    `/dashboard-cqrs/predictive-kpis?days=${days}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
}

// Hook combinado para todos los KPIs
export function useAllKPIs(period: string = 'mes', industryType: string = 'general', days: number = 30) {
  const { data: kpis, isLoading: kpisLoading, error: kpisError, mutate: mutateKPIs } = useKPIs(period)
  const { data: financial, isLoading: financialLoading, error: financialError, mutate: mutateFinancial } = useFinancialKPIs(period)
  const { data: industry, isLoading: industryLoading, error: industryError, mutate: mutateIndustry } = useIndustryKPIs(industryType)
  const { data: predictive, isLoading: predictiveLoading, error: predictiveError, mutate: mutatePredictive } = usePredictiveKPIs(days)

  const isLoading = kpisLoading || financialLoading || industryLoading || predictiveLoading
  const error = kpisError || financialError || industryError || predictiveError

  const mutate = () => {
    mutateKPIs()
    mutateFinancial()
    mutateIndustry()
    mutatePredictive()
  }

  return {
    kpis,
    financial,
    industry,
    predictive,
    isLoading,
    error,
    mutate
  }
}

// Hook optimizado que usa el endpoint unificado (NUEVO)
export function useOptimizedKPIs(period: string = 'mes', industryType: string = 'general', days: number = 30) {
  const { data, isLoading, error, mutate } = useSWR(
    `/dashboard-cqrs/all-kpis?period=${period}&industry=${industryType}&days=${days}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutos
      revalidateOnFocus: false,
      revalidateOnReconnect: false, // Cambiado a false para evitar requests innecesarios
      dedupingInterval: 300000, // Aumentado a 5 minutos
      errorRetryCount: 2, // Reducido
      errorRetryInterval: 10000, // Aumentado
      onError: (err) => {
        console.error('Error en useOptimizedKPIs:', err)
      }
    }
  )

  return {
    kpis: data?.data?.kpis || null,
    financial: data?.data?.financialKpis || null,
    industry: data?.data?.industryKpis || null,
    predictive: data?.data?.predictiveKpis || null,
    isLoading,
    error,
    mutate,
    cacheInfo: data?.cacheInfo || null,
    timestamp: data?.timestamp || null
  }
}

// Hook específico para datos de inventario (sin valores hardcodeados)
export function useInventoryKPIs(month: string = 'Marzo 2025') {
  const { data: kpis, isLoading, error, mutate } = useKPIs('mes')

  // Verificar si tenemos datos suficientes
  const hasSufficientData = kpis && 
    typeof kpis.totalProductos === 'number' && 
    typeof kpis.movimientosUltimoMes === 'number' &&
    typeof kpis.productosStockBajo === 'number'

  // Transformar datos solo si tenemos información suficiente
  const inventoryData = hasSufficientData ? {
    inventarioInicial: kpis.totalProductos,
    unidadesVendidas: kpis.movimientosUltimoMes,
    inventarioFinal: kpis.totalProductos - kpis.movimientosUltimoMes,
    stockCritico: kpis.productosStockBajo,
    rotacion: kpis.rotacionInventario || null,
    margenPromedio: kpis.margenPromedio || null,
    month,
    hasData: true
  } : {
    inventarioInicial: null,
    unidadesVendidas: null,
    inventarioFinal: null,
    stockCritico: null,
    rotacion: null,
    margenPromedio: null,
    month,
    hasData: false
  }

  return {
    data: inventoryData,
    isLoading,
    error,
    mutate,
    hasSufficientData
  }
} 