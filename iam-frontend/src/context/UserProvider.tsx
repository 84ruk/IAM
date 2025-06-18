'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUser } from '../lib/useUser'

interface UserContextType {
  user: any
  isLoading: boolean
  error: any
  mutate: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  mutate: () => {},
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, isLoading, error, mutate } = useUser()

  return (
    <UserContext.Provider value={{ user, isLoading, error, mutate }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => useContext(UserContext)