'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUser } from '../lib/useUser'
import { User } from '@/types/user'

interface UserContextType {
  user: User | null
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
  const { data: user, isLoading, error, mutate } = useUser();
  console.log('UserProvider user:', user, 'isLoading:', isLoading, 'error:', error)

  return (
    <UserContext.Provider value={{ user, isLoading, error, mutate }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => useContext(UserContext)