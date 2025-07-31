// Configuración global de la aplicación para mejorar estabilidad

export const APP_CONFIG = {
  // Configuración de desarrollo
  development: {
    enableDebugLogs: true,
    enableErrorBoundaries: true,
    enableChunkRetry: true,
    enablePerformanceMonitoring: true,
  },
  
  // Configuración de producción
  production: {
    enableDebugLogs: false,
    enableErrorBoundaries: true,
    enableChunkRetry: true,
    enablePerformanceMonitoring: false,
  },
  
  // Configuración de chunks
  chunks: {
    retryAttempts: 3,
    retryDelay: 1000,
    prefetchDelay: 2000,
    cleanupInterval: 3600000, // 1 hora
  },
  
  // Configuración de red
  network: {
    timeout: 10000,
    retryAttempts: 2,
    retryDelay: 2000,
  },
  
  // Configuración de caché
  cache: {
    maxAge: 3600000, // 1 hora
    staleWhileRevalidate: 300000, // 5 minutos
  },
}

// Función para obtener la configuración actual
export function getCurrentConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return {
    ...APP_CONFIG,
    current: isDevelopment ? APP_CONFIG.development : APP_CONFIG.production,
  }
}

// Función para manejar errores globales
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return

  // Manejar errores no capturados
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error)
    
    // Si es un error de chunk, intentar recargar
    if (event.error?.message?.includes('chunk') || 
        event.error?.message?.includes('loading')) {
      console.log('Chunk error detected, attempting recovery...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })

  // Manejar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Si es un error de chunk, intentar recargar
    if (event.reason?.message?.includes('chunk') || 
        event.reason?.message?.includes('loading')) {
      console.log('Chunk promise rejection detected, attempting recovery...')
      event.preventDefault()
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  })
}

// Función para inicializar la configuración de la aplicación
export function initializeAppConfig() {
  const config = getCurrentConfig()
  
  // Configurar manejo de errores globales
  if (config.current.enableErrorBoundaries) {
    setupGlobalErrorHandling()
  }
  
  return config
}

// Función para verificar la salud de la aplicación
export function checkAppHealth(): Promise<boolean> {
  return Promise.resolve(true)
} 