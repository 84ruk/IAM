'use client'

import { createContext, useContext } from 'react'
import { User } from '@/types/user'

export const ServerUserContext = createContext<User | null>(null)
export const useServerUser = () => useContext(ServerUserContext)

export function UserContextProvider({ user, children }: { user?: User, children: React.ReactNode }) {
  return <ServerUserContext.Provider value={user || null}>{children}</ServerUserContext.Provider>
} 