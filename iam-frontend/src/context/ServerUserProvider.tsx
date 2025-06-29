"use client"

import { User } from '@/types/user'
import { createContext, useContext } from 'react'

export const ServerUserContext = createContext<User | null>(null)
export const useServerUser = () => useContext(ServerUserContext)

export function UserContextProvider({ user, children }: { user: User, children: React.ReactNode }) {
  return <ServerUserContext.Provider value={user}>{children}</ServerUserContext.Provider>
}