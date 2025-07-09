'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSetupCheck } from '@/hooks/useSetupCheck'

interface SetupContextType {
  redirectToSetup: () => void
  onSetupComplete: () => void
}

const SetupContext = createContext<SetupContextType | undefined>(undefined)

export function SetupProvider({ children }: { children: ReactNode }) {
  const { refetch } = useSetupCheck()
  const router = useRouter()

  const onSetupComplete = async () => {
    // Re-verificar el estado de setup sin recargar la página
    await refetch()
  }

  const redirectToSetup = () => {
    router.push('/setup-empresa')
  }

  const value: SetupContextType = {
    redirectToSetup,
    onSetupComplete
  }

  return (
    <SetupContext.Provider value={value}>
      {children}
    </SetupContext.Provider>
  )
}

export function useSetup() {
  const context = useContext(SetupContext)
  if (context === undefined) {
    throw new Error('useSetup debe ser usado dentro de SetupProvider')
  }
  return context
} 