'use client'

import { useEffect, useRef, useState } from 'react'

export function usePerformance(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(performance.now())

  useEffect(() => {
    renderCount.current++
    
    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now()
      console.log(`[${componentName}] Render #${renderCount.current} - ${(endTime - startTime.current).toFixed(2)}ms`)
      startTime.current = endTime
    }
  })

  return { renderCount: renderCount.current }
}

// Hook para medir el tiempo de carga de componentes
export function useLoadTime(componentName: string) {
  const startTime = useRef(performance.now())

  useEffect(() => {
    const endTime = performance.now()
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Tiempo de carga: ${(endTime - startTime.current).toFixed(2)}ms`)
    }
  }, [componentName])

  return startTime.current
}

// Hook para medir el tiempo de hidratación
export function useHydrationTime(componentName: string) {
  const startTime = useRef(performance.now())
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      const endTime = performance.now()
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] Tiempo de hidratación: ${(endTime - startTime.current).toFixed(2)}ms`)
      }
    }
  }, [isHydrated, componentName])

  return { isHydrated }
} 