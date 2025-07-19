// Utilidades para formateo y cálculo de datos de KPIs

/**
 * Formatea un número como moneda en euros
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formatea un número como porcentaje
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

/**
 * Obtiene el color CSS según el valor y umbral
 */
export function getValueColor(value: number, threshold: number = 0): string {
  if (value > threshold) return 'text-green-600'
  if (value < threshold) return 'text-red-600'
  return 'text-gray-600'
}

/**
 * Obtiene el color CSS para el icono según el valor y umbral
 */
export function getIconColor(value: number, threshold: number = 0): string {
  if (value > threshold) return 'text-green-600'
  if (value < threshold) return 'text-red-600'
  return 'text-blue-600'
}

/**
 * Calcula el porcentaje de cambio entre dos valores
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Obtiene la tendencia basada en el porcentaje de cambio
 */
export function getTrendFromPercentageChange(percentageChange: number): 'ascendente' | 'descendente' | 'estable' {
  if (percentageChange > 5) return 'ascendente'
  if (percentageChange < -5) return 'descendente'
  return 'estable'
}

/**
 * Calcula el nivel de riesgo basado en días restantes
 */
export function calculateRiskLevel(daysRemaining: number): 'bajo' | 'medio' | 'alto' | 'crítico' {
  if (daysRemaining <= 0) return 'crítico'
  if (daysRemaining <= 3) return 'alto'
  if (daysRemaining <= 7) return 'medio'
  return 'bajo'
}

/**
 * Obtiene el color CSS para el nivel de riesgo
 */
export function getRiskColor(riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico'): string {
  switch (riskLevel) {
    case 'bajo':
      return 'text-green-600'
    case 'medio':
      return 'text-yellow-600'
    case 'alto':
      return 'text-orange-600'
    case 'crítico':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

/**
 * Obtiene el color CSS para el fondo del nivel de riesgo
 */
export function getRiskBgColor(riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico'): string {
  switch (riskLevel) {
    case 'bajo':
      return 'bg-green-50 border-green-200'
    case 'medio':
      return 'bg-yellow-50 border-yellow-200'
    case 'alto':
      return 'bg-orange-50 border-orange-200'
    case 'crítico':
      return 'bg-red-50 border-red-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

/**
 * Formatea una fecha para mostrar en gráficos
 */
export function formatChartDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit'
  })
}

/**
 * Formatea una fecha completa para mostrar en tooltips
 */
export function formatFullDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Calcula el promedio de un array de números
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * Calcula la suma de un array de números
 */
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0)
}

/**
 * Encuentra el valor máximo en un array de números
 */
export function findMax(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return Math.max(...numbers)
}

/**
 * Encuentra el valor mínimo en un array de números
 */
export function findMin(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return Math.min(...numbers)
}

/**
 * Calcula el margen bruto
 */
export function calculateGrossMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0
  return ((revenue - cost) / revenue) * 100
}

/**
 * Calcula la rentabilidad
 */
export function calculateProfitability(revenue: number, expenses: number): number {
  if (revenue === 0) return 0
  return ((revenue - expenses) / revenue) * 100
}

/**
 * Obtiene el nombre del mes en español
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[monthIndex] || 'Desconocido'
}

/**
 * Obtiene el nombre del período
 */
export function getPeriodName(period: string): string {
  const periods: Record<string, string> = {
    'mes': 'Último mes',
    'trimestre': 'Último trimestre',
    'semestre': 'Último semestre',
    'anio': 'Último año'
  }
  return periods[period] || period
}

/**
 * Obtiene el nombre de la industria
 */
export function getIndustryName(industry: string): string {
  const industries: Record<string, string> = {
    'general': 'Industria General',
    'alimentos': 'Alimentos',
    'farmacia': 'Farmacia',
    'ropa': 'Ropa',
    'electronica': 'Electrónica'
  }
  return industries[industry] || industry
}

/**
 * Formatea un número como moneda en pesos mexicanos
 */
export function formatCurrencyMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
} 