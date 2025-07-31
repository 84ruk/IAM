// Configuración para optimización de chunks y manejo de errores

export const CHUNK_LOAD_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
}

export const CHUNK_PREFETCH_CONFIG = {
  enabled: true,
  delay: 2000, // 2 segundos después de la carga inicial
}

// Función para manejar errores de carga de chunks
export function handleChunkLoadError(error: Error, retryCount = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (retryCount >= CHUNK_LOAD_RETRY_CONFIG.maxRetries) {
      console.error('Max retries reached for chunk load:', error)
      reject(error)
      return
    }

    const delay = CHUNK_LOAD_RETRY_CONFIG.retryDelay * Math.pow(CHUNK_LOAD_RETRY_CONFIG.backoffMultiplier, retryCount)
    
    setTimeout(() => {
      console.log(`Retrying chunk load (attempt ${retryCount + 1})`)
      resolve()
    }, delay)
  })
}

// Función para precargar chunks críticos
export function prefetchCriticalChunks(): void {
  if (typeof window === 'undefined' || !CHUNK_PREFETCH_CONFIG.enabled) return

  setTimeout(() => {
    // Precargar chunks de recharts
    const rechartsChunk = '/_next/static/chunks/node_modules_recharts_es6_41a5804c._.js'
    
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = rechartsChunk
    link.as = 'script'
    
    document.head.appendChild(link)
  }, CHUNK_PREFETCH_CONFIG.delay)
}

// Función para verificar si un chunk está disponible
export function isChunkAvailable(chunkName: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Verificar si el chunk está en el cache del navegador
    if ('caches' in window) {
      // caches.has() devuelve una Promise, así que siempre retornamos false
      // para evitar problemas de tipado. En una implementación real,
      // esto debería ser una función async
      return false
    }
    return false
  } catch {
    return false
  }
}

// Función para limpiar chunks obsoletos
export function cleanupObsoleteChunks(): void {
  if (typeof window === 'undefined' || !('caches' in window)) return

  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      if (cacheName.includes('chunks') && cacheName.includes('recharts')) {
        // Verificar si el chunk es muy antiguo (más de 1 hora)
        const cacheTime = cacheName.match(/\d+/)?.[0]
        if (cacheTime) {
          const age = Date.now() - parseInt(cacheTime)
          if (age > 3600000) { // 1 hora
            caches.delete(cacheName)
          }
        }
      }
    })
  })
}

// Configuración para el manejo de errores de red
export const NETWORK_ERROR_CONFIG = {
  timeout: 10000, // 10 segundos
  retryAttempts: 2,
  retryDelay: 2000,
}

// Función para manejar errores de red
export function handleNetworkError(error: Error, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.error(`Network error for ${url}:`, error)
    
    // Si es un error de chunk, intentar recargar la página
    if (error.message.includes('chunk') || error.message.includes('loading')) {
      console.log('Chunk loading error detected, attempting page reload...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    
    reject(error)
  })
} 