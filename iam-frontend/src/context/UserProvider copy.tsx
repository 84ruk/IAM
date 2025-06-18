'use client'

import { createContext, useContext } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
  }).then(res => {
    if (!res.ok) throw new Error('No autorizado')
    return res.json()
  })

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

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, error, isLoading, mutate } = useSWR('/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  })

  return (
    <UserContext.Provider value={{ user: data, isLoading, error, mutate }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => useContext(UserContext)
