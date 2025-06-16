// src/lib/useUser.ts
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
  }).then(res => {
    if (!res.ok) throw new Error('No autorizado')
    return res.json()
  })

export const useUser = () =>
  useSWR('/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, 
  })