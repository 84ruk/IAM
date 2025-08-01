'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSetupRedirect } from '@/hooks/useSetupRedirect'

interface SetupContextType {
  redirectToSetup: () => void
  onSetupComplete: () => void
  checkAndRedirect: () => Promise<void>
}

const SetupContext = createContext<SetupContextType | undefined>(undefined)

export function SetupProvider({ children }: { children: ReactNode }) {
  const { redirectToSetup, redirectAfterSetup, checkAndRedirect } = useSetupRedirect()

  const onSetupComplete = async () => {
    await redirectAfterSetup()
  }

  const value: SetupContextType = {
    redirectToSetup,
    onSetupComplete,
    checkAndRedirect
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