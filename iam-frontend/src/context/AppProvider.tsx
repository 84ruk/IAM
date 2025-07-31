'use client'

import { memo, ReactNode } from 'react'
import { ServerStatusProvider } from './ServerStatusContext'
import { UserContextProvider } from './ServerUserContext'
import { SetupProvider } from './SetupContext'
import { ToastProvider } from '@/components/ui/Toast'
import { User } from '@/types/user'

interface AppProviderProps {
  children: ReactNode
  user?: User
}

export const AppProvider = memo(({ children, user }: AppProviderProps) => {
  return (
    <ServerStatusProvider>
      <UserContextProvider user={user}>
        <SetupProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SetupProvider>
      </UserContextProvider>
    </ServerStatusProvider>
  )
})

AppProvider.displayName = 'AppProvider' 