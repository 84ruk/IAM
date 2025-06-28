// src/lib/useUser.ts
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
  }).then(async res => {
    console.log('useUser fetcher - URL:', url);
    console.log('useUser fetcher - Status:', res.status);
    
    if (!res.ok) {
      console.log('useUser fetcher - Error response:', res.status, res.statusText);
      throw new Error('No autorizado')
    }
    
    const data = await res.json();
    console.log('useUser fetcher - Data received:', data);
    return data;
  })

export const useUser = () =>
  useSWR('/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, 
    dedupingInterval: 60000, // 1 minuto
    onError: (error) => {
      console.log('useUser - Error:', error);
    },
    onSuccess: (data) => {
      console.log('useUser - Success:', data);
    }
  })