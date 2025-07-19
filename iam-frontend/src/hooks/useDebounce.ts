import { useState, useEffect, useRef } from 'react'

/**
 * Hook personalizado para implementar debounce en valores
 * @param value - El valor que se quiere debouncear
 * @param delay - El delay en milisegundos (por defecto 500ms)
 * @returns El valor debounceado
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook personalizado para búsqueda con debounce mejorado
 * @param searchValue - El valor de búsqueda
 * @param delay - El delay en milisegundos (por defecto 500ms)
 * @returns Objeto con el valor debounceado y estado de búsqueda
 */
export function useSearchDebounce(searchValue: string, delay: number = 500) {
  const debouncedValue = useDebounce(searchValue, delay)
  const isSearchingRef = useRef(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // Solo mostrar estado de búsqueda si hay un valor y es diferente al debounced
    if (searchValue && searchValue !== debouncedValue) {
      isSearchingRef.current = true
      setIsSearching(true)
    } else {
      // Pequeño delay para evitar parpadeo
      const timer = setTimeout(() => {
        isSearchingRef.current = false
        setIsSearching(false)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [searchValue, debouncedValue])

  return {
    debouncedValue,
    isSearching: isSearchingRef.current || isSearching
  }
} 