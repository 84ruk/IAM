'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useServerStatus, ServerStatus } from '@/hooks/useServerStatus'

interface ServerStatusContextType {
  status: ServerStatus
  lastCheck: Date | null
  responseTime: number | null
  retryCount: number
  isWarmingUp: boolean
  checkServerStatus: () => Promise<ServerStatus>
  warmUpServer: () => Promise<void>
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined)

export function ServerStatusProvider({ children }: { children: ReactNode }) {
  const serverStatus = useServerStatus()

  return (
    <ServerStatusContext.Provider value={serverStatus}>
      {children}
    </ServerStatusContext.Provider>
  )
}

export function useServerStatusContext() {
  const context = useContext(ServerStatusContext)
  if (context === undefined) {
    throw new Error('useServerStatusContext debe ser usado dentro de un ServerStatusProvider')
  }
  return context
}

// Hook simplificado para componentes que solo necesitan el estado
export function useServerState() {
  const { status, responseTime, retryCount, isWarmingUp } = useServerStatusContext()
  return { status, responseTime, retryCount, isWarmingUp }
}

// Hook para acciones del servidor
export function useServerActions() {
  const { checkServerStatus, warmUpServer } = useServerStatusContext()
  return { checkServerStatus, warmUpServer }
} 