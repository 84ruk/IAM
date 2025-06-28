'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../lib/useAuth'
import { User } from '@/types/user'

interface UserContextType {
  user: User | null
  isLoading: boolean
  error: any
  mutate: () => void
  logout: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  mutate: () => {},
  logout: () => {},
  isAuthenticated: false,
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, error, mutate, logout, isAuthenticated } = useAuth();

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      mutate, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => useContext(UserContext)