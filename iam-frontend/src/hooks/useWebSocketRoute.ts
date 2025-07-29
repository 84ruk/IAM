'use client'

import { useState, useEffect } from 'react'

export function useWebSocketRoute() {
  const [pathname, setPathname] = useState('')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setPathname(window.location.pathname)
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    const handleRouteChange = () => {
      setPathname(window.location.pathname)
    }
    
    // Escuchar cambios de ruta
    window.addEventListener('popstate', handleRouteChange)
    
    // Observer para cambios de URL en SPA
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== pathname) {
        setPathname(window.location.pathname)
      }
    })
    
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      observer.disconnect()
    }
  }, [mounted, pathname])
  
  // Rutas que necesitan WebSocket
  const needsWebSocket = pathname.includes('/importacion') || 
                        pathname.includes('/trabajos') ||
                        pathname.includes('/dashboard/importacion') ||
                        pathname.includes('/dashboard/importacion-avanzada')
  
  return {
    needsWebSocket,
    currentPath: pathname,
    mounted
  }
} 