// src/lib/useUser.ts
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
  }).then(async res => {
    if (!res.ok) {
      throw new Error('No autorizado')
    }
    const data = await res.json();
    return data;
  })

export const useUser = () =>
  useSWR('/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, 
    dedupingInterval: 60000, // 1 minuto
  })